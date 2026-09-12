import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::guide-material.guide-material' as any, ({ strapi }) => ({
  adminList: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::guide-material.guide-material').listForAdmin();
    ctx.send({ data });
  }),

  adminCreate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const email = ctx.state.adminUser?.email;
    const data = await strapi
      .service('api::guide-material.guide-material')
      .createMaterial(ctx.request.body || {}, email);
    ctx.send({ data });
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const email = ctx.state.adminUser?.email;
    const data = await strapi
      .service('api::guide-material.guide-material')
      .updateMaterial(ctx.params.documentId, ctx.request.body || {}, email);
    ctx.send({ data });
  }),

  adminDelete: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::guide-material.guide-material').deleteMaterial(ctx.params.documentId);
    ctx.send({ data });
  }),
}));
