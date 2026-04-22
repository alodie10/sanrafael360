import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../repositories/negocio-repository';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  claim: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    let body = ctx.request.body;
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : (body.data || body);
    const files = (ctx.request as any).files;

    const result = await strapi.service('api::negocio.negocio').claimNegocio(id, user, data, files);
    return ctx.send({ success: true, data: result });
  }),

  me: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const data = await strapi.service('api::negocio.negocio').getOwnerNegocios(user.id);
    return ctx.send({ success: true, data });
  }),

  portalUpdate: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    let body = ctx.request.body;
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : (body.data || body);

    const result = await strapi.service('api::negocio.negocio').updatePortal(id, user.id, data, (ctx.request as any).files);
    return ctx.send({ success: true, data: result });
  }),

  adminPendingClaims: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Blindaje de Rol: Aseguramos tener el rol para validar
    const fullUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['role']
    });

    const userRole = fullUser?.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin' || fullUser?.email === 'diegocristianalonso@gmail.com';
    
    if (!isAdmin) return ctx.forbidden();

    const repo = createNegocioRepository(strapi);
    const data = await repo.findPendingClaims([
      'owner', 
      'logo', 
      'documentacion_reclamo'
    ]);
    
    return ctx.send({ success: true, data });
  }),

  adminResolveClaim: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    const userRole = user?.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super admin' || user?.email === 'diegocristianalonso@gmail.com';
    
    if (!user || !isAdmin) return ctx.forbidden();
    const { id } = ctx.params;
    const { decision, motivo } = ctx.request.body;
    if (!decision) throw new ValidationError('Decisión requerida');
    const result = await strapi.service('api::negocio.negocio').resolveClaim(id, decision, motivo);
    return ctx.send({ success: true, data: result });
  }),

  resetClaimForTest: asyncHandler(async (ctx) => {
    const { slug } = ctx.params;
    // Solo permitido en desarrollo o local
    if (process.env.NODE_ENV === 'production' && ctx.state.user?.email !== 'diegocristianalonso@gmail.com') {
       return ctx.forbidden('Solo el admin puede resetear en produccion');
    }

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

    await strapi.documents('api::negocio.negocio').publish({
      documentId: negocio.documentId
    });

    return ctx.send({ success: true, message: `Reset exitoso para ${slug}` });
  })
}));
