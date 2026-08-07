import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';
import { createDailyStatRepository } from '../../daily-stat/repositories/daily-stat-repository';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { createPortalAdminService } from '../services/portal-admin';
import { createUserRepository } from '../../../repositories/user-repository';
import { getAdminEmails, userHasAdminAccess, resolveAdminUser } from '../../../utils/admin-access';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    const negocioRepo = createNegocioRepository(strapi);
    if (data && Array.isArray(data)) {
      await Promise.all(
        data.map(async (item) => {
          const fullItem = await negocioRepo.findById(item.documentId, ['owner']);
          if (fullItem?.owner) item.owner = { id: fullItem.owner.id };
        })
      );
    }
    return { data, meta };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (!response) return response;
    const { data, meta } = response;
    const negocioRepo = createNegocioRepository(strapi);

    if (data) {
      const fullItem = await negocioRepo.findById(data.documentId, ['owner']);
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
    const { startDate, endDate, includeNegocios } = ctx.query as {
      startDate?: string;
      endDate?: string;
      includeNegocios?: string;
    };
    const stats = await strapi.service('api::negocio.negocio').getPortalStats(
      isAdmin ? undefined : user.id,
      startDate as string,
      endDate as string
    );

    if (includeNegocios === '1' || includeNegocios === 'true') {
      const negocios = await strapi.service('api::negocio.negocio').getOwnerNegocios(user.id);
      return ctx.send({ success: true, data: { ...stats, negocios: negocios || [] } });
    }

    return ctx.send({ success: true, data: stats });
  }),

  getStatsTimeseries: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const fullUser = await resolveAdminUser(strapi, user);
    const isAdmin = userHasAdminAccess(fullUser);
    const { period = '30d', startDate, endDate } = ctx.query as {
      period?: string;
      startDate?: string;
      endDate?: string;
    };
    const data = await strapi.service('api::negocio.negocio').getStatsTimeseries(
      isAdmin ? undefined : user.id,
      period as string,
      startDate,
      endDate
    );
    return ctx.send({ success: true, data });
  }),

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
      fullUser = await createUserRepository(strapi).findWithRole(user.id);
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
    const dailyStatRepo = createDailyStatRepository(strapi);
    const negocios = await strapi.documents('api::negocio.negocio').findMany({ limit: -1 });
    let count = 0;
    for (const n of negocios) {
      if (Number(n.views) > 0 || Number(n.clicks_whatsapp) > 0 || Number(n.clicks_website) > 0) {
        await dailyStatRepo.create({
          negocio_id: n.documentId,
          date: '2026-05-15',
          views: Number(n.views) || 0,
          clicks_whatsapp: Number(n.clicks_whatsapp) || 0,
          clicks_website: Number(n.clicks_website) || 0,
        });
        count++;
      }
    }
    return ctx.send({ success: true, count });
  }),

  resetStatsBackfill: asyncHandler(async (ctx) => {
    const dailyStatRepo = createDailyStatRepository(strapi);
    const deleted = await dailyStatRepo.deleteAll();
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

        await dailyStatRepo.create({
          negocio_id: n.documentId,
          date: dateStr,
          views: dayViews,
          clicks_whatsapp: dayWsp,
          clicks_website: dayWeb,
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

    const data = await createPortalAdminService(strapi).getFavoritesForUser(user.id);
    return ctx.send({ success: true, data });
  }),

  toggleFavorite: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { documentId } = ctx.params;
    if (!documentId) throw new ValidationError('Negocio documentId es requerido');

    const result = await createPortalAdminService(strapi).toggleFavorite(user.id, documentId);
    return ctx.send({ success: true, ...result });
  }),

  modificarVigenciaPortal: asyncHandler(async (ctx) => {
    const { documentId } = ctx.params;
    const { premium_valid_until } = ctx.request.body;
    await createPortalAdminService(strapi).updateVigencia(documentId, premium_valid_until ?? null);
    return ctx.send({ success: true });
  }),

  cargarPagoPortal: asyncHandler(async (ctx) => {
    const { monto, estado, fecha_pago, external_reference, negocio, extendMonths } = ctx.request.body;
    const newPago = await createPortalAdminService(strapi).createManualPago({
      monto,
      estado,
      fecha_pago,
      external_reference,
      negocio,
      extendMonths,
    });
    return ctx.send({ success: true, data: newPago });
  }),

  borrarPagoPortal: asyncHandler(async (ctx) => {
    const { documentId } = ctx.params;
    await createPortalAdminService(strapi).deletePago(documentId);
    return ctx.send({ success: true });
  }),
}));
