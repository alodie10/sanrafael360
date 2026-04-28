import { factories } from '@strapi/strapi';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';

/**
 * Normaliza cualquier formato de hora al exacto HH:mm:ss.SSS que exige
 * Strapi v5 / PostgreSQL para el tipo `time`.
 *
 * Acepta: "11:00", "11:00:00", "11:00:00.000", "1:5" → devuelve siempre "HH:MM:SS.SSS"
 */
function normalizeTimeForDB(time: string): string {
  if (!time) return '00:00:00.000';
  const parts = time.split(':');
  const h = String(parseInt(parts[0] || '0', 10)).padStart(2, '0');
  const m = String(parseInt(parts[1] || '0', 10)).padStart(2, '0');
  // parts[2] puede ser "00", "00.000", "00.123", undefined
  const secParts = (parts[2] || '0').split('.');
  const s = String(parseInt(secParts[0] || '0', 10)).padStart(2, '0');
  const ms = String(parseInt(secParts[1] || '0', 10)).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export default factories.createCoreService('api::negocio.negocio', ({ strapi }) => ({
  async claimNegocio(id: string, user: any, bodyData: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (negocio.owner && negocio.estado_reclamo !== 'ninguno') throw new ValidationError('El negocio ya tiene un reclamo activo');

    const updated = await repo.update(id, { 
      estado_reclamo: 'pendiente', 
      owner: user.id,
      descripcion: bodyData.message || negocio.descripcion
    });

    const rawFile = files?.documentacion_reclamo || files?.files || files?.file;
    if (rawFile) {
      const claimFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;
      try {
        await repo.uploadFile(updated.documentId, 'documentacion_reclamo', claimFile);
      } catch (uploadErr: any) {
        strapi.log.error(`[ClaimFlow] Upload failed: ${uploadErr.message}`);
      }
    }

    // Notificación Admin
    await repo.sendAdminEmail(
      `🔔 Nuevo Reclamo de Propiedad: ${negocio.nombre}`,
      `<div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #2563eb; margin-top: 0;">Nueva Solicitud de Verificación</h2>
        <p style="font-size: 16px; line-height: 1.6;">Se ha recibido una nueva solicitud para reclamar la propiedad de un negocio en <strong>San Rafael 360</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Negocio:</strong> ${negocio.nombre}</p>
          <p style="margin: 5px 0;"><strong>Solicitante:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Mensaje:</strong> ${bodyData.message || '<em>Sin mensaje adjunto</em>'}</p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">Por favor, revise la documentación adjunta y apruebe o rechace el reclamo desde el portal de administración.</p>
        
        <div style="text-align: center;">
          <a href="https://www.sanrafael360.com/portal/admin" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">Ir al Portal de Administración</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático de San Rafael 360.</p>
      </div>`
    ).catch(e => strapi.log.error('Email error (Admin Notify):', e.message));

    // Log Activity
    await this.logActivity('info', 'Nuevo Reclamo', `El usuario ${user.email} reclamó el negocio ${negocio.nombre}`, id, user);
    
    return { id, status: 'pendiente' };
  },

  async updatePortal(id: string, user: any, data: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    
    if (!negocio) throw new NotFoundError('Negocio');

    // BLINDAJE MASTER: Permitir si es dueño O si es Admin
    const userRole = user.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin' || user.email === 'diegocristianalonso@gmail.com';
    const isOwner = negocio.owner?.id === user.id;

    strapi.log.info(`[updatePortal] User: ${user.email}, Role: ${userRole}, isAdmin: ${isAdmin}, isOwner: ${isOwner}`);

    if (!isOwner && !isAdmin) {
      strapi.log.error(`[updatePortal] Acceso denegado para ${user.email}. Role: ${userRole}`);
      throw new ForbiddenError('No tienes permisos para editar este negocio');
    }

    // Eliminar campos protegidos
    const forbiddenFields = ['owner', 'slug', 'documentId', 'id', 'estado_reclamo', 'publishedAt'];
    const updateData = { ...data };
    forbiddenFields.forEach(f => delete updateData[f]);

    // FIX Strapi 5: Eliminar IDs de componentes (schedules) 
    // para evitar el error "components not related to the entity"
    if (updateData.schedules && Array.isArray(updateData.schedules)) {
      updateData.schedules = updateData.schedules.map((h: any) => {
        const { id, ...rest } = h;
        return rest;
      });
    }

    // Normalizar el formato de hora de los schedules antes de guardar.
    // Strapi/PostgreSQL exige exactamente HH:mm:ss.SSS — no importa qué
    // mande el frontend (ej: 10:30 o 10:30:00), lo forzamos a 10:30:00.000
    if (Array.isArray(updateData.schedules)) {
      updateData.schedules = updateData.schedules.map((s: any) => ({
        ...s,
        opening_time: s.opening_time ? (s.opening_time.split('.')[0].length === 5 ? `${s.opening_time.split('.')[0]}:00.000` : (s.opening_time.split('.')[0].length === 8 ? `${s.opening_time.split('.')[0]}.000` : s.opening_time)) : null,
        closing_time: s.closing_time ? (s.closing_time.split('.')[0].length === 5 ? `${s.closing_time.split('.')[0]}:00.000` : (s.closing_time.split('.')[0].length === 8 ? `${s.closing_time.split('.')[0]}.000` : s.closing_time)) : null,
      }));
    }

    let updated = await repo.update(id, updateData);
    
    // Si hay archivos, los subimos y esperamos a que terminen
    if (files) {
      strapi.log.info(`[portalUpdate] Procesando archivos para: ${id}`);
      const uploadPromises = [];
      
      if (files.logo) uploadPromises.push(repo.uploadFile(updated.documentId, 'logo', files.logo));
      if (files.imagen_portada) uploadPromises.push(repo.uploadFile(updated.documentId, 'imagen_portada', files.imagen_portada));
      if (files.galeria) uploadPromises.push(repo.uploadFile(updated.documentId, 'galeria', files.galeria, true));
      
      await Promise.all(uploadPromises);
      
      // Volvemos a obtener el objeto fresco con las nuevas relaciones de media
      updated = await repo.findById(id, ['logo', 'imagen_portada', 'galeria', 'schedules']);
    }

    await repo.publish(id);

    // Log Activity
    await this.logActivity('info', 'Actualización de Perfil', `Perfil actualizado: ${negocio.nombre}`, id, { id: user.id });

    return updated;
  },

  async resolveClaim(id: string, decision: string, motivo: string) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const isApproved = decision === 'approved';
    const data = isApproved ? { estado_reclamo: 'aprobado' } : { estado_reclamo: 'ninguno', owner: null, trigger_discovery: true };
    
    await repo.update(id, data);
    if (isApproved) {
      await repo.publish(id);
    }

    const ownerEmail = negocio.owner?.email;
    if (ownerEmail) {
      const subject = isApproved ? '¡Tu reclamo ha sido aprobado!' : 'Información sobre tu reclamo';
      const html = `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
          <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">${isApproved ? 'Felicidades, tu negocio es tuyo' : 'Tu reclamo ha sido revisado'}</h2>
          <p>Hola, el equipo de <b>San Rafael 360</b> ha procesado tu solicitud para <b>${negocio.nombre}</b>.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p><strong>Estado:</strong> ${isApproved ? 'Aprobado ✅' : 'Rechazado ❌'}</p>
            ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
          </div>
          ${isApproved ? '<p>Ya puedes acceder al portal para editar tu información premium.</p>' : '<p>Si crees que esto es un error, por favor contáctanos via Soporte.</p>'}
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://www.sanrafael360.com/portal" style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ir al Portal</a>
          </div>
        </div>
      `;
      // BLINDAJE SENIOR: Error de email no bloqueante en resolusión de reclamo
      await repo.sendEmail(ownerEmail, subject, html).catch(e => strapi.log.error(`[EmailService] Error controlado enviando a ${ownerEmail}: ${e.message}`));
    }

    // Log Activity
    const ownerId = negocio.owner?.id;
    if (ownerId) {
      await this.logActivity(
        isApproved ? 'success' : 'error',
        isApproved ? 'Reclamo Aprobado' : 'Reclamo Rechazado',
        `El reclamo fue ${isApproved ? 'aprobado' : 'rechazado'}${motivo ? ': ' + motivo : ''}`,
        id,
        { id: ownerId }
      );
    }

    return { id, decision };
  },

  // Helper para actividades
  async logActivity(tipo: 'info' | 'warning' | 'success' | 'error', accion: string, detalles: string, negocioId?: string, user?: any) {
    try {
      if (user && user.id) {
        await (strapi.documents('api::actividad.actividad' as any) as any).create({
          data: {
            tipo,
            accion,
            detalles,
            negocio: negocioId,
            usuario: user.id,
          }
        });
      }
    } catch (err: any) {
      strapi.log.error(`[ActivityLog] Error persistente: ${err.message}`);
    }
  },

  async getOwnerNegocios(userId: number) {
    const repo = createNegocioRepository(strapi);
    return await repo.findByOwner(userId, ['logo', 'categoria', 'imagen_portada', 'galeria', 'schedules']);
  },

  async getPortalStats(userId?: number) {
    // Usamos el query engine para traer TODOS los registros sin paginación (solo los campos necesarios)
    const filters = userId ? { owner: userId } : {};
    
    // @ts-ignore
    const results = await strapi.documents('api::negocio.negocio').findMany({
      filters,
      fields: ['views', 'clicks_whatsapp', 'clicks_website'],
      limit: -1, 
    } as any);

    return results.reduce((acc, curr: any) => ({
      views: acc.views + (Number(curr.views) || 0),
      clicks_whatsapp: acc.clicks_whatsapp + (Number(curr.clicks_whatsapp) || 0),
      clicks_website: acc.clicks_website + (Number(curr.clicks_website) || 0),
      totalNegocios: results.length
    }), { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0 });
  }
}));
