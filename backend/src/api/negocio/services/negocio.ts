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

    strapi.log.info(`[ClaimFlow] Business updated (id: ${updated.id}). Inspecting files...`);
    strapi.log.debug(`[ClaimFlow] Files keys: ${Object.keys(files || {}).join(', ')}`);
    
    // Normalize file key: check for 'documentacion_reclamo' OR fallback to 'files'
    const rawFile = files?.documentacion_reclamo || files?.files || files?.file;
    
    if (rawFile) {
      // Handle Strapi 5 sometimes sending file as a single object or an array of 1 element
      const claimFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;
      strapi.log.info(`[ClaimFlow] Attempting upload for field: documentacion_reclamo, file name: ${claimFile.name || 'unknown'}`);
      
      try {
        await repo.uploadFile(updated.id, 'documentacion_reclamo', claimFile);
        strapi.log.info('[ClaimFlow] Upload successful.');
      } catch (uploadErr: any) {
        strapi.log.error(`[ClaimFlow] Upload failed: ${uploadErr.message}`);
      }
    } else {
      strapi.log.warn('[ClaimFlow] No file found in request files object.');
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

    const allowed = ['descripcion', 'facebook', 'instagram', 'website', 'reserva_habilitada', 'galeria'];
    const updateData: any = {};
    allowed.forEach(f => { 
      if (bodyData[f] !== undefined) {
        // Strapi 5 expects an array of IDs for media relations to sync/keep
        updateData[f] = bodyData[f];
      }
    });

    const updated = await repo.update(id, updateData);
    if (files) {
      if (files.logo) await repo.uploadFile(updated.id, 'logo', files.logo);
      if (files.imagen_portada) await repo.uploadFile(updated.id, 'imagen_portada', files.imagen_portada);
      if (files.galeria) await repo.uploadFile(updated.id, 'galeria', files.galeria);
    }
    await repo.publish(id);
    return updated;
  },

  async resolveClaim(id: string, decision: string, motivo: string) {
    const repo = createNegocioRepository(strapi);
    // Deep populate owner to ensure email is available
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const data = decision === 'approved' ? { estado_reclamo: 'aprobado' } : { estado_reclamo: 'ninguno', owner: null };
    await repo.update(id, data);
    await repo.publish(id);

    const subject = decision === 'approved' ? '¡Perfil Aprobado!' : 'Información sobre tu solicitud';
    const ownerEmail = negocio.owner?.email;
    
    if (ownerEmail) {
      await repo.sendEmail(ownerEmail, subject, `
        <p>Tu solicitud de reclamo para <b>${negocio.nombre}</b> ha sido: <b>${decision}</b>.</p>
        <p><b>Mensaje de la administración:</b> ${motivo}</p>
        ${decision === 'approved' ? '<p>Ya puedes acceder a tu portal para gestionar el negocio.</p>' : ''}
      `).catch(e => strapi.log.error('Email error (User Notify):', e.message));
    } else {
      strapi.log.warn(`Cannot send notification for claim ${id}: Owner email not found.`);
    }

    return { id, decision };
  }
}));
