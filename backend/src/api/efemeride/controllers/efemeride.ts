import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::efemeride.efemeride' as any, ({ strapi }) => ({
  adminList: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::efemeride.efemeride').listForAdmin();
    ctx.send({ data });
  }),

  adminGet: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::efemeride.efemeride').getForAdmin(ctx.params.documentId);
    ctx.send({ data });
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const body = ctx.request.body || {};
    const data = await strapi.service('api::efemeride.efemeride').updateFicha(ctx.params.documentId, body);
    ctx.send({ data });
  }),

  adminPremiumPicker: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::efemeride.efemeride').listPremiumPicker();
    ctx.send({ data });
  }),

  publicList: asyncHandler(async (ctx) => {
    const data = await strapi.service('api::efemeride.efemeride').listPublic();
    ctx.send({ data });
  }),

  publicBySlug: asyncHandler(async (ctx) => {
    const data = await strapi.service('api::efemeride.efemeride').getPublicBySlug(ctx.params.slug);
    ctx.send({ data });
  }),
}));
