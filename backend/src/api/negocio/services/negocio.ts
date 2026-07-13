import { factories } from '@strapi/strapi';
import { createDailyStatRepository } from '../../daily-stat/repositories/daily-stat-repository';
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

    // Registrar videos subidos directo a Cloudinary por el browser
    if (updateData.cloudinary_videos_urls && Array.isArray(updateData.cloudinary_videos_urls) && updateData.cloudinary_videos_urls.length > 0) {
      try {
        const videoIds: number[] = [];
        for (const videoUrl of updateData.cloudinary_videos_urls) {
          const filename = videoUrl.split('/').pop()?.split('?')[0] || 'video.mp4';
          const publicId = filename.replace(/\.[^.]+$/, '');

          // Strapi v5: registrar archivo externo creando una entrada directamente en la tabla de archivos
          const mediaEntry = await strapi.db.query('plugin::upload.file').create({
            data: {
              name: filename,
              alternativeText: `Video de ${negocio.nombre}`,
              caption: '',
              url: videoUrl,
              provider: 'cloudinary',
              provider_metadata: { public_id: publicId, resource_type: 'video' },
              mime: 'video/mp4',
              ext: '.mp4',
              size: 0,
              width: null,
              height: null,
              formats: null,
              hash: publicId,
              folderPath: '/',
            },
          });
          videoIds.push(mediaEntry.id);
        }

        if (videoIds.length > 0) {
          // Hacer append a la galería existente
          const current = await repo.findById(id, ['galeria']);
          const existingIds = (current.galeria || []).map((g: any) => g.id);
          await repo.update(id, { galeria: [...existingIds, ...videoIds] });
          strapi.log.info(`[PortalUpdate] ${videoIds.length} video(s) de Cloudinary registrados en la galería de ${negocio.nombre}`);
          updated = await repo.findById(id, ['logo', 'imagen_portada', 'galeria', 'schedules']);
        }
      } catch (videoErr: any) {
        strapi.log.error(`[PortalUpdate] Error registrando videos de Cloudinary: ${videoErr.message}`);
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
    // ─── Score de salud del perfil ────────────────────────────────────────────
    // Pesos: deben sumar 100. Cada campo se verifica de forma específica.
    const SCORE_WEIGHTS = [
      { key: 'descripcion',    weight: 20, check: (v: any) => typeof v === 'string' && v.trim().replace(/<[^>]*>/g, '').length >= 50 },
      { key: 'imagen_portada', weight: 20, check: (v: any) => !!v?.url },
      { key: 'telefono',       weight: 10, check: (v: any) => typeof v === 'string' && v.trim().length > 0 },
      { key: 'whatsapp',       weight: 10, check: (v: any) => typeof v === 'string' && v.trim().length > 0 },
      { key: 'direccion',      weight: 10, check: (v: any) => typeof v === 'string' && v.trim().length > 0 },
      { key: 'schedules',      weight: 10, check: (v: any) => Array.isArray(v) && v.length > 0 },
      { key: 'logo',           weight: 10, check: (v: any) => !!v?.url },
      { key: 'website',        weight:  5, check: (v: any) => typeof v === 'string' && v.trim().length > 0 },
      { key: 'instagram',      weight:  3, check: (v: any) => typeof v === 'string' && v.trim().length > 0 },
      { key: 'galeria',        weight:  2, check: (v: any) => Array.isArray(v) && v.length > 0 },
    ] as const;

    const computeProfileScore = (n: any): number => {
      let score = 0;
      for (const { key, weight, check } of SCORE_WEIGHTS) {
        if (check(n[key])) score += weight;
      }
      return score; // 0-100
    };
    // ─────────────────────────────────────────────────────────────────────────

    const filters = userId ? { owner: userId } : {};
    const negocios = await (strapi.documents('api::negocio.negocio') as any).findMany({
      filters,
      fields: [
        'nombre', 'documentId', 'views', 'clicks_whatsapp', 'clicks_website',
        'is_premium', 'premium_valid_until',
        // Campos para calcular salud del perfil
        'descripcion', 'telefono', 'whatsapp', 'direccion', 'website', 'instagram',
      ],
      populate: { imagen_portada: { fields: ['url'] }, logo: { fields: ['url'] }, galeria: { fields: ['url'] }, schedules: true },
      limit: -1,
    });

    let results = negocios;

    // Si hay rango de fechas, buscamos en daily-stat
    if (startDate && endDate) {
      const dailyStatRepo = createDailyStatRepository(strapi);
      const negocioIds = negocios.map((n: any) => n.documentId);
      const dailyStats = await dailyStatRepo.findMany({
        negocio_id: { $in: negocioIds },
        date: { $gte: startDate, $lte: endDate },
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

    const breakdownWithScore = results.map((r: any) => ({
      documentId: r.documentId,
      nombre: r.nombre,
      views: Number(r.views) || 0,
      clicks_whatsapp: Number(r.clicks_whatsapp) || 0,
      clicks_website: Number(r.clicks_website) || 0,
      is_premium: r.is_premium || false,
      premium_valid_until: r.premium_valid_until || null,
      profile_score: computeProfileScore(r),
    })).sort((a: any, b: any) => (b.views + b.clicks_whatsapp + b.clicks_website) - (a.views + a.clicks_whatsapp + a.clicks_website));

    const summary = breakdownWithScore.reduce((acc: any, curr: any) => ({
      views: acc.views + curr.views,
      clicks_whatsapp: acc.clicks_whatsapp + curr.clicks_whatsapp,
      clicks_website: acc.clicks_website + curr.clicks_website,
      totalNegocios: breakdownWithScore.length,
      // Promedio de salud del perfil entre todos los negocios del usuario
      profileScore: acc.profileScore + curr.profile_score,
    }), { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0, profileScore: 0 });

    // Convertir acumulado a promedio
    if (summary.totalNegocios > 0) {
      summary.profileScore = Math.round(summary.profileScore / summary.totalNegocios);
    }

    return { summary, breakdown: breakdownWithScore };
  },

  async getStatsTimeseries(userId?: number, period: string = '30d') {
    // Calcular rango de fechas
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    const startISO = startDate.toISOString().split('T')[0];
    const endISO = endDate.toISOString().split('T')[0];

    // Si hay userId, solo incluir negocios del propietario
    let negocioIds: string[] | undefined;
    if (userId) {
      const negocios = await (strapi.documents('api::negocio.negocio') as any).findMany({
        filters: { owner: userId },
        fields: ['documentId'],
        limit: -1,
      });
      negocioIds = negocios.map((n: any) => n.documentId);
      if (negocioIds!.length === 0) return [];
    }

    // Consultar daily stats en el rango
    const filters: any = {
      date: { $gte: startISO, $lte: endISO },
    };
    if (negocioIds) {
      filters.negocio_id = { $in: negocioIds };
    }

    const dailyStatRepo = createDailyStatRepository(strapi);
    const rawStats = await dailyStatRepo.findMany(filters);

    // Agrupar por fecha sumando todos los negocios
    const byDate: Record<string, { views: number; clicks_whatsapp: number; clicks_website: number }> = {};
    rawStats.forEach((stat: any) => {
      const d = stat.date; // "YYYY-MM-DD"
      if (!byDate[d]) byDate[d] = { views: 0, clicks_whatsapp: 0, clicks_website: 0 };
      byDate[d].views += Number(stat.views) || 0;
      byDate[d].clicks_whatsapp += Number(stat.clicks_whatsapp) || 0;
      byDate[d].clicks_website += Number(stat.clicks_website) || 0;
    });

    // Rellenar todos los días del rango (incluso los vacíos) para curva continua
    const result = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = cursor.toISOString().split('T')[0];
      result.push({
        date: key,
        views: byDate[key]?.views ?? 0,
        clicks_whatsapp: byDate[key]?.clicks_whatsapp ?? 0,
        clicks_website: byDate[key]?.clicks_website ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
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
    const dailyStatRepo = createDailyStatRepository(strapi);
    const today = new Date().toISOString().split('T')[0];
    const currentDaily = await dailyStatRepo.findByNegocioAndDate(negocio.documentId, today);

    if (currentDaily) {
      await dailyStatRepo.update(currentDaily.documentId, {
        [field]: Number(currentDaily[field] || 0) + 1,
      });
    } else {
      await dailyStatRepo.create({
        negocio_id: negocio.documentId,
        date: today,
        views: type === 'view' ? 1 : 0,
        clicks_whatsapp: type === 'whatsapp' ? 1 : 0,
        clicks_website: type === 'website' ? 1 : 0,
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
