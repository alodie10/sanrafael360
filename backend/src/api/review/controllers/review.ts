import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { UnauthorizedError } from '../../../utils/errors';

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    const enhancedData = await strapi.service('api::review.review').enrichWithAutorUsername(data);
    return { data: enhancedData, meta };
  },

  create: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError();

    const { data } = ctx.request.body as { data: { rating: number; comentario: string; negocio: string } };
    const newReview = await strapi.service('api::review.review').createReviewForUser(user, data);

    return { data: newReview };
  }),
}));
