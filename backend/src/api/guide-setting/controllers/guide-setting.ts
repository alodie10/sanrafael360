import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::guide-setting.guide-setting' as any, ({ strapi }) => ({
  adminGet: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::guide-setting.guide-setting').getSettings();
    ctx.send({ data });
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi
      .service('api::guide-setting.guide-setting')
      .updateSettings(ctx.request.body || {});
    ctx.send({ data });
  }),
}));
