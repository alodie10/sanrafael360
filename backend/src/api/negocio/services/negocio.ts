import { factories } from '@strapi/strapi';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';

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


    
    // Normalize file key: check for 'documentacion_reclamo' OR fallback to 'files'
    const rawFile = files?.documentacion_reclamo || files?.files || files?.file;
    
    if (rawFile) {
      // Handle Strapi 5 sometimes sending file as a single object or an array of 1 element
      const claimFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;

      
      try {
        // Use documentId in Strapi 5 to insure we link to the document draft/published correctly
        await repo.uploadFile(updated.documentId, 'documentacion_reclamo', claimFile);

      } catch (uploadErr: any) {
        strapi.log.error(`[ClaimFlow] Upload failed: ${uploadErr.message}`);
      }
    } else {

    }

    await repo.sendEmail(
      'diegocristianalonso@gmail.com',
      `Nuevo reclamo: ${negocio.nombre}`,
      `<p>El usuario <b>${user.email}</b> ha iniciado un reclamo para el negocio <b>${negocio.nombre}</b>.</p><p>Mensaje: ${bodyData.message || 'Sin mensaje'}</p>`
    ).catch(e => strapi.log.error('Email error (Admin Notify):', e.message));
    
    return { id, status: 'pendiente' };
  },

  async getOwnerNegocios(userId: number) {
    const repo = createNegocioRepository(strapi);
    const res = await repo.findByOwner(userId, ['logo', 'categoria', 'imagen_portada', 'galeria']);
    return Array.from(new Map((res as any[]).map(i => [i.id, i])).values());
  },

  async updatePortal(id: string, userId: number, bodyData: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (Number(negocio.owner?.id) !== Number(userId)) throw new ForbiddenError();

    const allowed = [
      'nombre', 
      'direccion', 
      'latitud', 
      'longitud', 
      'descripcion', 
      'facebook', 
      'instagram', 
      'website', 
      'reserva_habilitada', 
      'galeria', 
      'price_range', 
      'schedules'
    ];
    
    const normalizeTime = (time: string | null) => {
      if (!time) return null;
      if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00.000`;
      return time;
    };

    const updateData: any = {};
    allowed.forEach(f => { 
      if (bodyData[f] !== undefined) {
        if (f === 'schedules' && Array.isArray(bodyData[f])) {
          updateData[f] = bodyData[f].map((s: any) => ({
            ...s,
            opening_time: normalizeTime(s.opening_time),
            closing_time: normalizeTime(s.closing_time)
          }));
        } else {
          updateData[f] = bodyData[f];
        }
      }
    });

    const updated = await repo.update(id, updateData);
    if (files) {
      if (files.logo) await repo.uploadFile(updated.documentId, 'logo', files.logo);
      if (files.imagen_portada) await repo.uploadFile(updated.documentId, 'imagen_portada', files.imagen_portada);
      if (files.galeria) await repo.uploadFile(updated.documentId, 'galeria', files.galeria, true);
    }
    await repo.publish(id);

    // Log Activity
    await (strapi.documents('api::actividad.actividad' as any) as any).create({
      data: {
        accion: 'Actualización de Perfil',
        detalles: `El dueño actualizó la información pública de ${negocio.nombre}`,
        negocio: negocio.id,
        usuario: userId,
        tipo: 'info'
      }
    }).catch(err => strapi.log.error(`[ActivityLog] Error: ${err.message}`));
    return updated;
  },

  async resolveClaim(id: string, decision: string, motivo: string) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const isApproved = decision === 'approved';
    const data = isApproved ? { estado_reclamo: 'aprobado' } : { estado_reclamo: 'ninguno', owner: null };
    
    await repo.update(id, data);
    await repo.publish(id);

    // DIAGNÓSTICO FORZADO - ESCRIBIR ERROR A ARCHIVO FÍSICO
    const fs = require('fs');
    const path = require('path');
    const diagPath = path.join(process.cwd(), 'DIAGNOSTICO_REAL.txt');

    try {
      // 1. Log de Actividad
      await (strapi.documents('api::actividad.actividad' as any) as any).create({
        data: {
          accion: isApproved ? 'Reclamo Aprobado' : 'Reclamo Rechazado',
          detalles: `El reclamo de ${negocio.nombre} fue ${isApproved ? 'aprobado' : 'rechazado'}${motivo ? ': ' + motivo : ''}`,
          negocio: id,
          usuario: negocio.owner?.id,
          tipo: isApproved ? 'success' : 'error'
        }
      });
      fs.appendFileSync(diagPath, `[${new Date().toISOString()}] ✅ Actividad creada correctamente\n`);
    } catch (err: any) {
      const errorMsg = `[${new Date().toISOString()}] ❌ ERROR ACTIVIDAD: ${err.message}\n${JSON.stringify(err.details || {}, null, 2)}\n`;
      fs.appendFileSync(diagPath, errorMsg);
      strapi.log.error(errorMsg);
    }

    const subject = isApproved ? '¡Bienvenido a San Rafael 360!' : 'Actualización sobre tu solicitud de reclamo';
    const ownerEmail = negocio.owner?.email;
    const portalUrl = 'https://www.sanrafael360.com/portal';
    
    if (ownerEmail) {
      const html = isApproved 
        ? `<div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #2563eb;">¡Felicidades, ${negocio.nombre} ya es tuyo!</h2>
            <p>Tu solicitud de propiedad ha sido aprobada. Ya puedes empezar a gestionar tu perfil, actualizar horarios y subir fotos.</p>
            <p><b>Mensaje del administrador:</b> ${motivo}</p>
            <div style="margin: 30px 0;">
              <a href="${portalUrl}" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acceder a mi Portal</a>
            </div>
            <p style="font-size: 12px; color: #666;">Si el botón no funciona, copia y pega este link: ${portalUrl}</p>
           </div>`
        : `<div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #dc2626;">Información sobre tu solicitud</h2>
            <p>Tu solicitud de reclamo para <b>${negocio.nombre}</b> ha sido rechazada por el siguiente motivo:</p>
            <p style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626;">"${motivo}"</p>
            <p>No te preocupes, puedes volver a intentarlo corrigiendo la documentación o el mensaje en el portal.</p>
            <div style="margin: 30px 0;">
              <a href="${portalUrl}" style="background: #374151; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Volver a intentar</a>
            </div>
           </div>`;

      try {
        await repo.sendEmail(ownerEmail, subject, html);
        fs.appendFileSync(diagPath, `[${new Date().toISOString()}] ✅ Email enviado correctamente a ${ownerEmail}\n`);
      } catch (e: any) {
        const errorMsg = `[${new Date().toISOString()}] ❌ ERROR EMAIL (${ownerEmail}): ${e.message}\n`;
        fs.appendFileSync(diagPath, errorMsg);
        strapi.log.error(errorMsg);
      }
    } else {
      fs.appendFileSync(diagPath, `[${new Date().toISOString()}] ⚠️ No se encontró email para el owner de ${id}\n`);
    }

    return { id, decision };
  }
}));
