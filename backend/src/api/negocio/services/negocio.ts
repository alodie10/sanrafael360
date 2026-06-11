import { factories } from '@strapi/strapi';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { ADMIN_EMAILS } from '../../../utils/constants';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';
import { logActivity } from '../../../utils/strapi-utils';
import { getAdminClaimEmail, getOwnerResolutionEmail } from './templates/email-templates';
import { DiscoveryService } from '../../../services/discovery-service';

const discoveryService = new DiscoveryService();

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
    if (!isAdmin) {
      forbiddenFields.push('is_premium', 'premium_valid_until');
    }
    const updateData = { ...data };
    forbiddenFields.forEach(f => delete updateData[f]);

    // Limpieza de categoría para evitar Invalid relations
    if (!updateData.categoria || updateData.categoria === "" || updateData.categoria === "undefined") {
      delete updateData.categoria;
    }

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

    // Auto-Discovery Síncrono (Si el usuario presionó el botón)
    if (updateData.trigger_discovery === true) {
      strapi.log.info(`[PortalUpdate] Ejecutando Auto-Discovery síncrono para ${negocio.nombre}`);
      try {
        const discovery = await discoveryService.discover(updateData.nombre || negocio.nombre);
        if (discovery.success && discovery.data) {
          updateData.google_rating = discovery.data.rating;
          updateData.google_review_count = discovery.data.user_ratings_total;
          updateData.google_place_id = discovery.data.place_id;
          if (discovery.data.google_maps_url) updateData.google_maps_url = discovery.data.google_maps_url;
          if (!updateData.website && discovery.data.website) updateData.website = discovery.data.website;
          if (!updateData.telefono && discovery.data.telefono) updateData.telefono = discovery.data.telefono;
          
          strapi.log.info(`[PortalUpdate] Auto-Discovery exitoso. Rating: ${discovery.data.rating}`);

          // ---- LÓGICA DE FOTOS INTELIGENTE ----
          if (discovery.data.photo_references && discovery.data.photo_references.length > 0) {
            const negocioDB = await repo.findById(id, ['imagen_portada', 'galeria']);
            
            const isUploadingCover = !!(updateData.imagen_portada || files?.imagen_portada || files?.['files.imagen_portada']);
            // El frontend envía galeria: [] si no hay fotos, lo cual es truthy. Debemos ignorarlo si está vacío.
            const isUploadingGallery = (Array.isArray(updateData.galeria) && updateData.galeria.length > 0) || !!(updateData.galeria && !Array.isArray(updateData.galeria)) || !!files?.galeria || !!files?.['files.galeria'];
            
            const needsGallery = (!negocioDB.galeria || negocioDB.galeria.length === 0) && !isUploadingGallery;
            
            // Si falta galería, también forzamos re-descargar la portada de Google (para reemplazar logos mal puestos),
            // a menos que el usuario esté subiendo una portada manualmente en este instante.
            const needsCover = (!negocioDB.imagen_portada || needsGallery) && !isUploadingCover;
            
            if (needsCover || needsGallery) {
              const refsToDownload = [];
              if (needsCover && discovery.data.photo_references.length > 0) {
                refsToDownload.push(discovery.data.photo_references[0]);
              }
              if (needsGallery) {
                const startIndex = needsCover ? 1 : 0;
                refsToDownload.push(...discovery.data.photo_references.slice(startIndex, 3));
              }

              if (refsToDownload.length > 0) {
                strapi.log.info(`[PortalUpdate] Descargando ${refsToDownload.length} fotos desde Google Places...`);
                const downloadedIds = await discoveryService.downloadPhotosToStrapi(refsToDownload, updateData.nombre || negocio.nombre, strapi);
                
                if (downloadedIds.length > 0) {
                  let idIndex = 0;
                  if (needsCover && downloadedIds[idIndex]) {
                    updateData.imagen_portada = downloadedIds[idIndex];
                    idIndex++;
                  }
                  if (needsGallery && downloadedIds.slice(idIndex).length > 0) {
                    updateData.galeria = downloadedIds.slice(idIndex);
                  }
                }
              }
            }
          }
          // ---- FIN LÓGICA DE FOTOS ----
          
        } else {
          strapi.log.warn(`[PortalUpdate] Auto-Discovery falló o no encontró datos: ${discovery.error}`);
        }
      } catch (err: any) {
        strapi.log.error(`[PortalUpdate] Error en Auto-Discovery: ${err.message}`);
      }
      updateData.trigger_discovery = false; // Reset flag
    }

    let updated = await repo.update(id, updateData);
    
    if (files) {
      const uploadPromises = [];
      // Soportar tanto "logo" como "files.logo" para flexibilidad
      const logo = files.logo || files['files.logo'];
      const cover = files.imagen_portada || files['files.imagen_portada'];
      const galeria = files.galeria || files['files.galeria'];

      if (logo) {
        strapi.log.info(`[PortalUpdate] Subiendo logo para ${negocio.nombre}`);
        uploadPromises.push(repo.uploadFile(updated.documentId, 'logo', logo));
      }
      if (cover) {
        strapi.log.info(`[PortalUpdate] Subiendo portada para ${negocio.nombre}`);
        uploadPromises.push(repo.uploadFile(updated.documentId, 'imagen_portada', cover));
      }
      if (galeria) {
        strapi.log.info(`[PortalUpdate] Subiendo galería para ${negocio.nombre}`);
        uploadPromises.push(repo.uploadFile(updated.documentId, 'galeria', galeria, true));
      }
      
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        // Recargar con los nuevos IDs de medios
        updated = await repo.findById(id, ['logo', 'imagen_portada', 'galeria', 'schedules']);
      }
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
    return await repo.findByOwner(userId, ['logo', 'categoria', 'atributos', 'imagen_portada', 'galeria', 'schedules']);
  },

  async getPortalStats(userId?: number, startDate?: string, endDate?: string) {
    const filters = userId ? { owner: userId } : {};
    const negocios = await (strapi.documents('api::negocio.negocio') as any).findMany({
      filters,
      fields: ['nombre', 'documentId', 'views', 'clicks_whatsapp', 'clicks_website', 'is_premium', 'premium_valid_until'],
      limit: -1, 
    });

    let results = negocios;

    // Si hay rango de fechas, buscamos en daily-stat
    if (startDate && endDate) {
      const negocioIds = negocios.map((n: any) => n.documentId);
      const dailyStats = await strapi.documents('api::daily-stat.daily-stat').findMany({
        filters: {
          negocio_id: { $in: negocioIds },
          date: { $gte: startDate, $lte: endDate }
        },
        limit: -1
      });

      // Mapeamos los totales por negocio
      const statsByNegocio: Record<string, any> = {};
      dailyStats.forEach((stat: any) => {
        if (!statsByNegocio[stat.negocio_id]) {
          statsByNegocio[stat.negocio_id] = { views: 0, clicks_whatsapp: 0, clicks_website: 0 };
        }
        statsByNegocio[stat.negocio_id].views += (Number(stat.views) || 0);
        statsByNegocio[stat.negocio_id].clicks_whatsapp += (Number(stat.clicks_whatsapp) || 0);
        statsByNegocio[stat.negocio_id].clicks_website += (Number(stat.clicks_website) || 0);
      });

      // Sobrescribir los resultados con los totales de fechas
      results = negocios.map((n: any) => ({
        ...n,
        views: statsByNegocio[n.documentId]?.views || 0,
        clicks_whatsapp: statsByNegocio[n.documentId]?.clicks_whatsapp || 0,
        clicks_website: statsByNegocio[n.documentId]?.clicks_website || 0,
      }));
    }

    const summary = results.reduce((acc: any, curr: any) => ({
      views: acc.views + (Number(curr.views) || 0),
      clicks_whatsapp: acc.clicks_whatsapp + (Number(curr.clicks_whatsapp) || 0),
      clicks_website: acc.clicks_website + (Number(curr.clicks_website) || 0),
      totalNegocios: results.length
    }), { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0 });

    const breakdown = results.map((r: any) => ({
      documentId: r.documentId,
      nombre: r.nombre,
      views: Number(r.views) || 0,
      clicks_whatsapp: Number(r.clicks_whatsapp) || 0,
      clicks_website: Number(r.clicks_website) || 0,
      is_premium: r.is_premium || false,
      premium_valid_until: r.premium_valid_until || null
    })).sort((a: any, b: any) => (b.views + b.clicks_whatsapp + b.clicks_website) - (a.views + a.clicks_whatsapp + a.clicks_website));

    return { summary, breakdown };
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

    // 1. Actualizar global
    const result = await strapi.documents('api::negocio.negocio').update({
      documentId: negocio.documentId,
      data: { [field]: currentValue + 1 },
      status: 'published'
    });

    // 2. Actualizar Daily Stat
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = await strapi.documents('api::daily-stat.daily-stat').findMany({
      filters: { negocio_id: negocio.documentId, date: today },
      limit: 1
    });

    if (dailyStats && dailyStats.length > 0) {
      const currentDaily = dailyStats[0];
      await strapi.documents('api::daily-stat.daily-stat').update({
        documentId: currentDaily.documentId,
        data: { [field]: Number(currentDaily[field] || 0) + 1 },
        status: 'published'
      });
    } else {
      await strapi.documents('api::daily-stat.daily-stat').create({
        data: { 
          negocio_id: negocio.documentId, 
          date: today, 
          views: type === 'view' ? 1 : 0,
          clicks_whatsapp: type === 'whatsapp' ? 1 : 0,
          clicks_website: type === 'website' ? 1 : 0
        },
        status: 'published'
      });
    }

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
