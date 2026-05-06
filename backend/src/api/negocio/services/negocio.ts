import { factories } from '@strapi/strapi';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { ADMIN_EMAILS } from '../../../utils/constants';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';
import { logActivity } from '../../../utils/strapi-utils';
import { getAdminClaimEmail, getOwnerResolutionEmail } from './templates/email-templates';

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
      getAdminClaimEmail(negocio.nombre, user.email, bodyData.message)
    ).catch(e => strapi.log.error('Email error (Admin Notify):', e.message));

    await logActivity(strapi, 'info', 'Nuevo Reclamo', `El usuario ${user.email} reclamó el negocio ${negocio.nombre}`, id, user);
    
    return { id, status: 'pendiente' };
  },

  async updatePortal(id: string, user: any, data: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const roleName = user.role?.name?.toLowerCase();
    const roleType = user.role?.type?.toLowerCase();
    const userEmail = user.email?.toLowerCase();
    
    const isAdmin = roleName === 'admin' || 
                    roleName === 'super admin' || 
                    roleType === 'admin' || 
                    roleType === 'superadmin' || 
                    ADMIN_EMAILS.includes(userEmail);

    const isOwner = negocio.owner?.id === user.id;

    if (!isOwner && !isAdmin) {
      strapi.log.warn(`[Forbidden] User ${userEmail} (Role: ${roleType}) denied access to ${negocio.nombre}`);
      throw new ForbiddenError('No tienes permisos para editar este negocio');
    }

    const forbiddenFields = ['owner', 'slug', 'documentId', 'id', 'estado_reclamo', 'publishedAt'];
    const updateData = { ...data };
    forbiddenFields.forEach(f => delete updateData[f]);

    // Cleanup schedules IDs
    if (updateData.schedules && Array.isArray(updateData.schedules)) {
      updateData.schedules = updateData.schedules.map(({ id, ...rest }: any) => rest);
    }

    // Normalize hours
    if (Array.isArray(updateData.schedules)) {
      updateData.schedules = updateData.schedules.map((s: any) => ({
        ...s,
        opening_time: s.opening_time ? (s.opening_time.split('.')[0].length === 5 ? `${s.opening_time.split('.')[0]}:00.000` : (s.opening_time.split('.')[0].length === 8 ? `${s.opening_time.split('.')[0]}.000` : s.opening_time)) : null,
        closing_time: s.closing_time ? (s.closing_time.split('.')[0].length === 5 ? `${s.closing_time.split('.')[0]}:00.000` : (s.closing_time.split('.')[0].length === 8 ? `${s.closing_time.split('.')[0]}.000` : s.closing_time)) : null,
      }));
    }

    let updated = await repo.update(id, updateData);
    
    if (files) {
      const uploadPromises = [];
      if (files.logo) uploadPromises.push(repo.uploadFile(updated.documentId, 'logo', files.logo));
      if (files.imagen_portada) uploadPromises.push(repo.uploadFile(updated.documentId, 'imagen_portada', files.imagen_portada));
      if (files.galeria) uploadPromises.push(repo.uploadFile(updated.documentId, 'galeria', files.galeria, true));
      await Promise.all(uploadPromises);
      updated = await repo.findById(id, ['logo', 'imagen_portada', 'galeria', 'schedules']);
    }

    await repo.publish(id);
    await logActivity(strapi, 'info', 'Actualización de Perfil', `Perfil actualizado: ${negocio.nombre}`, id, { id: user.id });

    return updated;
  },

  async resolveClaim(id: string, decision: string, motivo: string) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const isApproved = decision === 'approved';
    const data = isApproved ? { estado_reclamo: 'aprobado' } : { estado_reclamo: 'ninguno', owner: null, trigger_discovery: true };
    
    await repo.update(id, data);
    if (isApproved) await repo.publish(id);

    const ownerEmail = negocio.owner?.email;
    if (ownerEmail) {
      const subject = isApproved ? '¡Tu reclamo ha sido aprobado!' : 'Información sobre tu reclamo';
      await repo.sendEmail(ownerEmail, subject, getOwnerResolutionEmail(negocio.nombre, isApproved, motivo))
        .catch(e => strapi.log.error(`[EmailService] Error enviando a ${ownerEmail}: ${e.message}`));
    }

    if (negocio.owner?.id) {
      await logActivity(
        strapi, 
        isApproved ? 'success' : 'error', 
        isApproved ? 'Reclamo Aprobado' : 'Reclamo Rechazado', 
        `El reclamo fue ${isApproved ? 'aprobado' : 'rechazado'}${motivo ? ': ' + motivo : ''}`,
        id, 
        { id: negocio.owner.id }
      );
    }

    return { id, decision };
  },

  async getOwnerNegocios(userId: number) {
    const repo = createNegocioRepository(strapi);
    return await repo.findByOwner(userId, ['logo', 'categoria', 'imagen_portada', 'galeria', 'schedules']);
  },

  async getPortalStats(userId?: number) {
    const filters = userId ? { owner: userId } : {};
    const results = await (strapi.documents('api::negocio.negocio') as any).findMany({
      filters,
      fields: ['views', 'clicks_whatsapp', 'clicks_website'],
      limit: -1, 
    });

    return results.reduce((acc: any, curr: any) => ({
      views: acc.views + (Number(curr.views) || 0),
      clicks_whatsapp: acc.clicks_whatsapp + (Number(curr.clicks_whatsapp) || 0),
      clicks_website: acc.clicks_website + (Number(curr.clicks_website) || 0),
      totalNegocios: results.length
    }), { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0 });
  },

  async incrementStats(id: string, type: 'view' | 'whatsapp' | 'website') {
    let negocio = await strapi.documents('api::negocio.negocio').findOne({ documentId: id });
    if (!negocio) {
      const results = await strapi.documents('api::negocio.negocio').findMany({ filters: { slug: id } });
      negocio = results[0];
    }
    if (!negocio) throw new ValidationError('Negocio no encontrado');

    const field = type === 'view' ? 'views' : type === 'whatsapp' ? 'clicks_whatsapp' : 'clicks_website';
    const currentValue = Number(negocio[field] || 0);

    const result = await strapi.documents('api::negocio.negocio').update({
      documentId: negocio.documentId,
      data: { [field]: currentValue + 1 },
      status: 'published'
    });
    return result[field];
  },

  async resetClaim(slug: string) {
    const data = await strapi.documents('api::negocio.negocio').findMany({
      filters: { slug },
      status: 'published'
    });
    const negocio = data[0];
    if (!negocio) throw new ValidationError('Negocio no encontrado');

    await strapi.documents('api::negocio.negocio').update({
      documentId: negocio.documentId,
      data: {
        estado_reclamo: 'ninguno',
        owner: null,
        documentacion_reclamo: null,
        reclamar_habilitado: true,
        descripcion: null
      }
    });
    return await strapi.documents('api::negocio.negocio').publish({ documentId: negocio.documentId });
  }
}));
