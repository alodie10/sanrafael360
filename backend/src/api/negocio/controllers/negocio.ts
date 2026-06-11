import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { ADMIN_EMAILS } from '../../../utils/constants';

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
    const { data, meta } = await super.findOne(ctx);
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
    const isAdmin = user.role?.name?.toLowerCase() === 'admin' || ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const { startDate, endDate } = ctx.query;
    const stats = await strapi.service('api::negocio.negocio').getPortalStats(isAdmin ? undefined : user.id, startDate as string, endDate as string);
    return ctx.send({ success: true, data: stats });
  }),

  me: async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const data = await strapi.service('api::negocio.negocio').getOwnerNegocios(user.id);
    return { data: data || [] }; 
  },

  portalUpdate: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    
    // TEMPORARY BYPASS FOR MASS SYNC
    let fullUser = { email: ADMIN_EMAILS[0], role: { name: 'Admin' }, id: -1 };
    
    const body = ctx.request.body;
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : (body.data || body);
    const result = await strapi.service('api::negocio.negocio').updatePortal(id, fullUser, data, (ctx.request as any).files);
    return ctx.send({ success: true, data: result });
  }),

  adminPendingClaims: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const fullUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['role']
    });
    const userRole = fullUser?.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin' || ADMIN_EMAILS.includes(fullUser?.email?.toLowerCase());
    if (!isAdmin) return ctx.forbidden();
    const repo = createNegocioRepository(strapi);
    const data = await repo.findPendingClaims(['owner', 'logo', 'documentacion_reclamo']);
    return ctx.send({ success: true, data });
  }),

  adminResolveClaim: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    const userRole = user?.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin' || ADMIN_EMAILS.includes(user?.email?.toLowerCase());
    if (!user || !isAdmin) return ctx.forbidden();
    const { id } = ctx.params;
    const { decision, motivo } = ctx.request.body;
    if (!decision) throw new ValidationError('Decisión requerida');
    const result = await strapi.service('api::negocio.negocio').resolveClaim(id, decision, motivo);
    return ctx.send({ success: true, data: result });
  }),

  resetClaimForTest: asyncHandler(async (ctx) => {
    const { slug } = ctx.params;
    if (process.env.NODE_ENV === 'production' && !ADMIN_EMAILS.includes(ctx.state.user?.email?.toLowerCase())) {
       return ctx.forbidden('Solo el admin puede resetear en produccion');
    }
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
    if (process.env.NODE_ENV === 'production' && !ADMIN_EMAILS.includes(ctx.state.user?.email?.toLowerCase())) {
       return ctx.forbidden('Solo el admin');
    }
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
  })
}));
