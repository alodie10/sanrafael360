import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { getAdminEmails, userHasAdminAccess, resolveAdminUser, isAdminEmail } from '../../../utils/admin-access';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    if (data && Array.isArray(data)) {
      await Promise.all(data.map(async (item) => {
        const fullItem = await strapi.documents('api::negocio.negocio').findOne({
          documentId: item.documentId,
          populate: ['owner']
        });
        if (fullItem?.owner) item.owner = { id: fullItem.owner.id };
      }));
    }
    return { data, meta };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (!response) return response;
    const { data, meta } = response;
    
    if (data) {
      const fullItem = await strapi.documents('api::negocio.negocio').findOne({
        documentId: data.documentId,
        populate: ['owner']
      });
      if (fullItem?.owner) data.owner = { id: fullItem.owner.id };
    }
    return { data, meta };
  },

  claim: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const body = ctx.request.body;
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : (body.data || body);
    const result = await strapi.service('api::negocio.negocio').claimNegocio(id, user, data, (ctx.request as any).files);
    return ctx.send({ success: true, data: result });
  }),

  getStatsSummary: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const fullUser = await resolveAdminUser(strapi, user);
    const isAdmin = userHasAdminAccess(fullUser);
    const { startDate, endDate } = ctx.query;
    const stats = await strapi.service('api::negocio.negocio').getPortalStats(isAdmin ? undefined : user.id, startDate as string, endDate as string);
    return ctx.send({ success: true, data: stats });
  }),

  getStatsTimeseries: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const fullUser = await resolveAdminUser(strapi, user);
    const isAdmin = userHasAdminAccess(fullUser);
    const { period = '30d' } = ctx.query as { period?: string };
    const data = await strapi.service('api::negocio.negocio').getStatsTimeseries(
      isAdmin ? undefined : user.id,
      period as string
    );
    return ctx.send({ success: true, data });
  }),

  me: async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const data = await strapi.service('api::negocio.negocio').getOwnerNegocios(user.id);
    return { data: data || [] }; 
  },

  deleteOferta: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { negocioId, ofertaId } = ctx.params;
    if (!negocioId || !ofertaId) return ctx.badRequest('negocioId y ofertaId requeridos');

    const { syncNegocioToAlgolia } = require('../services/algolia');

    // 1. Borrar la oferta
    try {
      await strapi.documents('api::oferta.oferta').delete({ documentId: String(ofertaId) });
    } catch (err: any) {
      strapi.log.error('[deleteOferta] Error al borrar oferta:', err);
      return ctx.internalServerError('Error al eliminar la oferta');
    }

    // 2. Sincronizar Algolia de forma síncrona (espera a que termine antes de responder)
    try {
      await syncNegocioToAlgolia(String(negocioId));
    } catch (err: any) {
      strapi.log.warn('[deleteOferta] Oferta borrada pero error en Algolia sync:', err);
      // No fallamos el request — la oferta ya fue borrada
    }

    return ctx.send({ success: true });
  }),

  algoliaSync: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { documentId } = ctx.params;
    if (!documentId) return ctx.badRequest('documentId requerido');

    const { syncNegocioToAlgolia } = require('../services/algolia');
    try {
      await syncNegocioToAlgolia(String(documentId));
      return ctx.send({ success: true });
    } catch (err: any) {
      strapi.log.error('[algoliaSync] Error:', err);
      return ctx.internalServerError('Error al sincronizar con Algolia');
    }
  }),

  portalUpdate: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const isApiToken = ctx.state.auth && ctx.state.auth.strategy.name === 'api-token';
    
    let fullUser;
    if (isApiToken) {
      fullUser = { email: getAdminEmails()[0], role: { name: 'Admin' }, id: -1 };
    } else {
      if (!user) return ctx.unauthorized();
      fullUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role']
      });
    }
    
    const body = ctx.request.body;
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : (body.data || body);
    const result = await strapi.service('api::negocio.negocio').updatePortal(id, fullUser, data, (ctx.request as any).files);
    return ctx.send({ success: true, data: result });
  }),

  adminPendingClaims: asyncHandler(async (ctx) => {
    const repo = createNegocioRepository(strapi);
    const data = await repo.findPendingClaims(['owner', 'logo', 'documentacion_reclamo']);
    return ctx.send({ success: true, data });
  }),

  adminResolveClaim: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const { decision, motivo } = ctx.request.body;
    if (!decision) throw new ValidationError('Decisión requerida');
    const result = await strapi.service('api::negocio.negocio').resolveClaim(id, decision, motivo);
    return ctx.send({ success: true, data: result });
  }),

  resetClaimForTest: asyncHandler(async (ctx) => {
    const { slug } = ctx.params;
    await strapi.service('api::negocio.negocio').resetClaim(slug);
    return ctx.send({ success: true, message: `Reset exitoso para ${slug}` });
  }),

  incrementStats: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const { type } = ctx.request.body;
    if (!['view', 'whatsapp', 'website'].includes(type)) throw new ValidationError('Tipo de estadística inválido');
    const count = await strapi.service('api::negocio.negocio').incrementStats(id, type);
    return ctx.send({ success: true, count });
  }),

  backfillStats: asyncHandler(async (ctx) => {
    const negocios = await strapi.documents('api::negocio.negocio').findMany({ limit: -1 });
    let count = 0;
    for (const n of negocios) {
      if (Number(n.views) > 0 || Number(n.clicks_whatsapp) > 0 || Number(n.clicks_website) > 0) {
        await strapi.documents('api::daily-stat.daily-stat').create({
          data: {
            negocio_id: n.documentId,
            date: '2026-05-15',
            views: Number(n.views) || 0,
            clicks_whatsapp: Number(n.clicks_whatsapp) || 0,
            clicks_website: Number(n.clicks_website) || 0
          },
          status: 'published'
        });
        count++;
      }
    }
    return ctx.send({ success: true, count });
  }),

  resetStatsBackfill: asyncHandler(async (ctx) => {
    // 1. Borrar todos los daily_stats existentes
    const existing = await strapi.documents('api::daily-stat.daily-stat').findMany({ limit: -1 });
    let deleted = 0;
    for (const stat of existing) {
      await strapi.documents('api::daily-stat.daily-stat').delete({ documentId: stat.documentId });
      deleted++;
    }
    strapi.log.info(`[ResetBackfill] ${deleted} registros eliminados.`);

    // 2. Regenerar distribuidos en los últimos 30 días
    const negocios = await strapi.documents('api::negocio.negocio').findMany({ limit: -1 });
    const DAYS = 30;
    const today = new Date();
    const weights = Array.from({ length: DAYS }, (_, i) => i + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let created = 0;
    for (const n of negocios) {
      const totalViews = Number(n.views) || 0;
      const totalWsp = Number(n.clicks_whatsapp) || 0;
      const totalWeb = Number(n.clicks_website) || 0;
      if (totalViews === 0 && totalWsp === 0 && totalWeb === 0) continue;

      for (let i = 0; i < DAYS; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (DAYS - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        const w = weights[i];
        const dayViews = Math.round((totalViews * w) / totalWeight);
        const dayWsp = Math.round((totalWsp * w) / totalWeight);
        const dayWeb = Math.round((totalWeb * w) / totalWeight);
        if (dayViews === 0 && dayWsp === 0 && dayWeb === 0) continue;

        await strapi.documents('api::daily-stat.daily-stat').create({
          data: { negocio_id: n.documentId, date: dateStr, views: dayViews, clicks_whatsapp: dayWsp, clicks_website: dayWeb },
          status: 'published'
        });
        created++;
      }
    }
    strapi.log.info(`[ResetBackfill] ${created} registros creados distribuidos en ${DAYS} días.`);
    return ctx.send({ success: true, deleted, created });
  }),


  getFavorites: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    
    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: { 
        favoritos: {
          populate: ['categoria', 'imagen_portada', 'owner']
        }
      }
    });
    
    const favList = (dbUser?.favoritos || []).map((n: any) => ({
      ...n,
      // strapi.db.query devuelve document_id (snake_case), normalizar para el frontend
      documentId: n.documentId || n.document_id,
      categoria: n.categoria ? { ...n.categoria, documentId: n.categoria.documentId || n.categoria.document_id } : null,
    }));
    
    return ctx.send({
      success: true,
      data: favList
    });
  }),

  toggleFavorite: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    
    const { documentId } = ctx.params;
    if (!documentId) throw new ValidationError('Negocio documentId es requerido');

    const negocio = await strapi.db.query('api::negocio.negocio').findOne({
      where: { documentId }
    });
    if (!negocio) return ctx.notFound('Negocio no encontrado');

    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['favoritos'],
    });

    const favorites = dbUser?.favoritos || [];
    const negocioId = Number(negocio.id);
    const isFavorited = favorites.some((f: any) => Number(f.id) === negocioId);

    let newFavoritesIds = favorites.map((f: any) => Number(f.id));

    if (isFavorited) {
      // Remover del array
      newFavoritesIds = newFavoritesIds.filter(id => id !== negocioId);
    } else {
      // Agregar al array
      newFavoritesIds.push(negocioId);
    }

    await strapi.entityService.update('plugin::users-permissions.user', user.id, {
      data: { 
        favoritos: newFavoritesIds
      }
    });

    return ctx.send({
      success: true,
      action: isFavorited ? 'removed' : 'added',
      documentId
    });
  }),
    async modificarVigenciaPortal(ctx) {
    try {
      const { documentId } = ctx.params;
      const { premium_valid_until } = ctx.request.body;
      
      const is_premium = premium_valid_until ? (new Date(premium_valid_until) >= new Date(new Date().setHours(0,0,0,0))) : false;

      let validUntilISO = null;
      if (premium_valid_until) {
         const d = new Date(premium_valid_until);
         d.setHours(12, 0, 0, 0); // Evitar problemas de timezone
         validUntilISO = d.toISOString();
      }

      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        },
        status: 'draft'
      });
      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        },
        status: 'published'
      });

      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error actualizando vigencia");
    }
  },

    
  async cargarPagoPortal(ctx) {
    try {
      const { monto, estado, fecha_pago, external_reference, negocio, extendMonths } = ctx.request.body;
      
      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado: estado || 'aprobado',
          fecha_pago,
          external_reference: external_reference || "",
          mp_preference_id: "manual_" + Date.now(), // Asegurar que sea string
          mp_payment_id: "manual_" + Date.now(),    // Asegurar que sea string
          negocio
        },
        status: 'published'
      });

      // Extender vigencia del negocio si se pidió
      if (extendMonths > 0) {
        const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio });
        if (negocioObj) {
          const now = new Date();
          const validUntil = negocioObj.premium_valid_until ? new Date(negocioObj.premium_valid_until) : new Date();
          const baseDate = validUntil < now ? now : validUntil;
          baseDate.setMonth(baseDate.getMonth() + extendMonths);

          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            },
            status: 'draft'
          });
          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            },
            status: 'published'
          });
        }
      }

      ctx.send({ success: true, data: newPago });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error creando pago manual");
    }
  },

  async borrarPagoPortal(ctx) {
    try {
      const { documentId } = ctx.params;
      
      // Strapi 5 uses alphanumeric documentId, but legacy clients might send numeric id
      let targetDocumentId = documentId;
      if (!isNaN(Number(documentId))) {
        // It's a numeric ID, fetch the documentId first
        const pago = await strapi.db.query('api::pago.pago').findOne({
          where: { id: Number(documentId) }
        });
        if (!pago) {
          return ctx.notFound("Pago no encontrado");
        }
        targetDocumentId = pago.documentId;
      }
      
      await strapi.documents('api::pago.pago').delete({ documentId: targetDocumentId });
      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error eliminando pago");
    }
  },
}));
