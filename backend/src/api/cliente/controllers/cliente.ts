import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::cliente.cliente', ({ strapi }) => ({
  adminList: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await strapi.service('api::cliente.cliente').listClientes();
    ctx.send({ data });
  }),

  adminCreate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const body = ctx.request.body || {};
    const data = await strapi.service('api::cliente.cliente').createCliente(body);
    ctx.send({ data });
  }),

  adminUpdate: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { documentId } = ctx.params;
    const body = ctx.request.body || {};
    const data = await strapi.service('api::cliente.cliente').updateCliente(documentId, body);
    ctx.send({ data });
  }),

  adminDelete: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { documentId } = ctx.params;
    const data = await strapi.service('api::cliente.cliente').deleteCliente(documentId);
    ctx.send({ data });
  }),

  adminLinkNegocios: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { documentId } = ctx.params;
    const { negocioIds } = ctx.request.body || {};
    const data = await strapi
      .service('api::cliente.cliente')
      .linkNegocios(documentId, negocioIds || []);
    ctx.send({ data });
  }),

  adminUnlinkNegocio: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { documentId } = ctx.params;
    const { negocioId } = ctx.request.body || {};
    const data = await strapi
      .service('api::cliente.cliente')
      .unlinkNegocio(documentId, negocioId);
    ctx.send({ data });
  }),

  adminNegociosPicker: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const search = typeof ctx.query?.search === 'string' ? ctx.query.search : undefined;
    const data = await strapi.service('api::cliente.cliente').listNegociosForPicker(search);
    ctx.send({ data });
  }),

  adminMailTest: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const body = ctx.request.body || {};
    const toEmail = body.toEmail || ctx.state.adminUser.email;
    const data = await strapi.service('api::cliente.cliente').sendTestMail({
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      toEmail,
      adminUser: ctx.state.adminUser,
    });
    ctx.send({ data });
  }),

  adminMailBroadcast: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const body = ctx.request.body || {};
    const data = await strapi.service('api::cliente.cliente').sendBroadcast({
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      audience: body.audience || 'all',
      documentIds: body.documentIds,
      adminUser: ctx.state.adminUser,
    });
    ctx.send({ data });
  }),

  unsubscribePublic: asyncHandler(async (ctx) => {
    const token = typeof ctx.query?.token === 'string' ? ctx.query.token : '';
    const data = await strapi.service('api::cliente.cliente').unsubscribeByToken(token);
    ctx.send({ data });
  }),
}));
