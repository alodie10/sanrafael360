import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError, ValidationError } from '../../../utils/errors';
import {
  createCheckout,
  processReservaPaymentNotification,
  simulateReservaSuccess,
} from '../services/checkout';
import { createReservaRepository } from '../repositories/reserva-repository';
import {
  adminAgenda,
  adminCancelReserva,
  adminCreateBloqueo,
  adminDeleteBloqueo,
  adminListComercios,
  adminWalkIn,
} from '../services/admin-reserva';
import { cancelReserva } from '../services/cancel-reserva';
import { verifyReservaCancelToken } from '../services/cancel-token';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

export default factories.createCoreController('api::reserva.reserva', ({ strapi }) => ({
  checkout: asyncHandler(async (ctx) => {
    const body = ctx.request.body || {};
    const result = await createCheckout(strapi, {
      slug: body.slug,
      recursoDocumentId: body.recursoDocumentId,
      inicio: body.inicio,
      cliente_nombre: body.cliente_nombre,
      cliente_email: body.cliente_email,
      cliente_telefono: body.cliente_telefono,
    });
    ctx.send({ success: true, data: result });
  }),

  simulateSuccess: asyncHandler(async (ctx) => {
    const { reservaDocumentId } = ctx.request.body || {};
    if (!reservaDocumentId) {
      throw new ValidationError('reservaDocumentId requerido');
    }
    const result = await simulateReservaSuccess(strapi, String(reservaDocumentId));
    ctx.send({ success: true, data: result });
  }),

  webhook: asyncHandler(async (ctx) => {
    const { query } = ctx;
    const paymentId = query.id || query['data.id'] || ctx.request.body?.data?.id;
    const type = query.type || query.topic || ctx.request.body?.type;

    if ((type === 'payment' || query.topic === 'payment') && paymentId) {
      strapi.log.info(`[ReservaWebhook] Pago ID: ${paymentId}`);
      await processReservaPaymentNotification(strapi, String(paymentId));
    } else {
      strapi.log.info(`[ReservaWebhook] Ignorado type=${type ?? 'n/a'}`);
    }

    ctx.send({ received: true });
  }),

  publicByCodigo: asyncHandler(async (ctx) => {
    const { codigo } = ctx.params;
    if (!codigo) throw new ValidationError('codigo requerido');
    const repo = createReservaRepository(strapi);
    const reserva = await repo.findByCodigo(String(codigo), {
      comercio: { fields: ['nombre', 'nombre_publico', 'slug', 'texto_llegada'] },
      recurso: { fields: ['nombre', 'orden'] },
    });
    if (!reserva) {
      ctx.notFound('Reserva no encontrada');
      return;
    }
    ctx.send({
      data: {
        codigo: reserva.codigo,
        estado: reserva.estado,
        inicio: reserva.inicio,
        fin: reserva.fin,
        cliente_nombre: reserva.cliente_nombre,
        monto_ars: reserva.monto_ars,
        comercio: reserva.comercio,
        recurso: reserva.recurso,
      },
    });
  }),

  adminListComercios: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const data = await adminListComercios(strapi);
    ctx.send({ data });
  }),

  adminAgenda: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { slug } = ctx.params;
    const fecha = typeof ctx.query.fecha === 'string' ? ctx.query.fecha : undefined;
    const dias = ctx.query.dias !== undefined ? Number(ctx.query.dias) : 1;
    const data = await adminAgenda(strapi, slug, { fecha, dias });
    ctx.send({ data });
  }),

  adminWalkIn: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { slug } = ctx.params;
    const body = ctx.request.body || {};
    const data = await adminWalkIn(strapi, slug, body);
    ctx.send({ data });
  }),

  adminCreateBloqueo: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { slug } = ctx.params;
    const body = ctx.request.body || {};
    const data = await adminCreateBloqueo(strapi, slug, body);
    ctx.send({ data });
  }),

  adminDeleteBloqueo: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { slug, documentId } = ctx.params;
    const data = await adminDeleteBloqueo(strapi, slug, documentId);
    ctx.send({ data });
  }),

  adminCancelReserva: asyncHandler(async (ctx) => {
    assertAdmin(ctx);
    const { slug, documentId } = ctx.params;
    const data = await adminCancelReserva(strapi, slug, documentId);
    ctx.send({ data });
  }),

  publicCancel: asyncHandler(async (ctx) => {
    const token =
      (typeof ctx.query.token === 'string' && ctx.query.token) ||
      ctx.request.body?.token;
    if (!token) throw new ValidationError('token requerido');

    const documentId = verifyReservaCancelToken(String(token));
    if (!documentId) throw new ValidationError('token inválido o vencido');

    const slug = ctx.params.slug;
    const data = await cancelReserva({
      strapi,
      reservaDocumentId: documentId,
      actor: 'self',
      comercioSlug: slug,
    });
    ctx.send({ data });
  }),
}));
