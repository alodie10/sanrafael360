import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::guide-expansion.guide-expansion' as any, ({ strapi }) => ({
  adminList: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::guide-expansion.guide-expansion').listForAdmin();
    ctx.send({ data });
  }),

  adminCreate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const email = ctx.state.adminUser?.email;
    const data = await strapi
      .service('api::guide-expansion.guide-expansion')
      .createExpansion(ctx.request.body || {}, email);
    ctx.send({ data });
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const email = ctx.state.adminUser?.email;
    const data = await strapi
      .service('api::guide-expansion.guide-expansion')
      .updateExpansion(ctx.params.documentId, ctx.request.body || {}, email);
    ctx.send({ data });
  }),

  adminDuplicate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const email = ctx.state.adminUser?.email;
    const data = await strapi
      .service('api::guide-expansion.guide-expansion')
      .duplicateExpansion(ctx.params.documentId, email);
    ctx.send({ data });
  }),

  publicRuntime: asyncHandler(async (ctx) => {
    const expansions = await strapi.service('api::guide-expansion.guide-expansion').activeIntentMap();
    const settings = await strapi.service('api::guide-setting.guide-setting').getSettings();
    ctx.send({ data: { expansions, settings } });
  }),
}));
