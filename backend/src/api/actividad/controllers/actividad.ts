import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { UnauthorizedError } from '../../../utils/errors';

export default factories.createCoreController('api::actividad.actividad' as any, ({ strapi }) => ({
  find: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError();

    const result = await strapi
      .service('api::actividad.actividad')
      .listForAuthenticatedUser(user, ctx.query as any);

    ctx.send(result);
  }),
}));
