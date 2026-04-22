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
      `Nuevo Reclamo: ${negocio.nombre}`,
      `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #2563eb;">Se ha recibido un nuevo reclamo de propiedad</h2>
        <p><strong>Negocio:</strong> ${negocio.nombre}</p>
        <p><strong>Usuario:</strong> ${user.email}</p>
        <p><strong>Mensaje:</strong> ${bodyData.message || 'Sin mensaje'}</p>
        <div style="margin-top: 25px;">
          <a href="https://www.sanrafael360.com/portal/admin" style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver en el Panel Admin</a>
        </div>
      </div>`
    ).catch(e => strapi.log.error('Email error (Admin Notify):', e.message));

    // Log Activity
    await this.logActivity('info', 'Nuevo Reclamo', `El usuario ${user.email} reclamó el negocio ${negocio.nombre}`, id, user);
    
    return { id, status: 'pendiente' };
  },

  async updatePortal(id: string, userId: number, data: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    
    if (!negocio) throw new NotFoundError('Negocio');
    if (negocio.owner?.id !== userId) throw new ForbiddenError('No eres el dueño de este negocio');

    const protectedFields = ['nombre', 'categoria', 'documentacion_reclamo', 'estado_reclamo', 'owner', 'premium', 'destacado'];
    const updateData = { ...data };
    protectedFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== negocio[field]) {
         delete updateData[field];
      }
    });

    // Normalizar el formato de hora de los schedules antes de guardar.
    // Strapi/PostgreSQL exige exactamente HH:mm:ss.SSS — no importa qué
    // formato envíe el frontend (HH:MM, HH:MM:SS, HH:MM:SS.SSS, etc.)
    if (Array.isArray(updateData.schedules)) {
      updateData.schedules = updateData.schedules.map((s: any) => ({
        ...s,
        opening_time: s.opening_time ? normalizeTimeForDB(s.opening_time) : null,
        closing_time: s.closing_time ? normalizeTimeForDB(s.closing_time) : null,
      }));
    }

    const updated = await repo.update(id, updateData);
    strapi.log.info(`[portalUpdate] schedules guardados: ${JSON.stringify(updateData.schedules ?? [])}`);
    if (files) {
      if (files.logo) await repo.uploadFile(updated.documentId, 'logo', files.logo);
      if (files.imagen_portada) await repo.uploadFile(updated.documentId, 'imagen_portada', files.imagen_portada);
      if (files.galeria) await repo.uploadFile(updated.documentId, 'galeria', files.galeria, true);
    }
    await repo.publish(id);

    // Log Activity
    await this.logActivity('info', 'Actualización de Perfil', `El dueño actualizó la información de ${negocio.nombre}`, id, { id: userId });

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
  }
}));
