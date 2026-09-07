import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::guide-miss.guide-miss' as any, ({ strapi }) => ({
  adminList: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::guide-miss.guide-miss').listForAdmin(ctx.query || {});
    ctx.send({ data });
  }),

  adminPatch: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const estado = ctx.request.body?.estado;
    const data = await strapi.service('api::guide-miss.guide-miss').patchEstado(ctx.params.documentId, estado);
    ctx.send({ data });
  }),

  recordPublic: asyncHandler(async (ctx) => {
    const body = ctx.request.body || {};
    const data = await strapi.service('api::guide-miss.guide-miss').recordMiss(body);
    ctx.send({ data });
  }),
}));
