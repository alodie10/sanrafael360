import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { UnauthorizedError } from '../../../utils/errors';

export default factories.createCoreController('api::oferta.oferta', ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) {
      ctx.query.filters = strapi.service('api::oferta.oferta').buildPublicFilters(ctx.query.filters);
    }
    return super.find(ctx);
  },

  create: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError();
    const body = ctx.request.body?.data || ctx.request.body || {};
    const result = await strapi.service('api::oferta.oferta').createForOwner(user, body);
    ctx.send({ data: result });
  }),

  update: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError();
    const body = ctx.request.body?.data || ctx.request.body || {};
    const result = await strapi
      .service('api::oferta.oferta')
      .updateForOwner(user, String(ctx.params.id || ctx.params.documentId), body);
    ctx.send({ data: result });
  }),
}));
