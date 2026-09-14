import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { UnauthorizedError } from '../../../utils/errors';

export default factories.createCoreController('api::soporte.soporte' as any, ({ strapi }) => ({
  createTicket: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError();
    const body = ctx.request.body?.data || ctx.request.body || {};
    const result = await strapi.service('api::soporte.soporte').createFromUser(user, body);
    ctx.send({ data: result });
  }),

  adminFind: asyncHandler(async (ctx) => {
    const result = await strapi.service('api::soporte.soporte').listForAdmin(ctx.query);
    ctx.send(result);
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    const respuesta = ctx.request.body?.data?.respuesta ?? ctx.request.body?.respuesta;
    const result = await strapi
      .service('api::soporte.soporte')
      .replyAsAdmin(String(ctx.params.documentId), respuesta);
    ctx.send({ data: result });
  }),
}));
