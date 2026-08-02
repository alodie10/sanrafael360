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
import { adminGetConfig, adminUpdateConfig } from '../services/admin-config';
import { getReservaCancelContact } from '../services/cancel-contact';
import { verifyReservaCancelToken } from '../services/cancel-token';

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
    const isAdmin = Boolean(ctx.state.adminUser);
    const user = ctx.state.user;
    if (!isAdmin && !user) {
      throw new ForbiddenError('Acceso restringido');
    }
    const data = await adminListComercios(strapi, user, isAdmin);
    ctx.send({ data });
  }),

  adminAgenda: asyncHandler(async (ctx) => {
    // adminUser o owner ya validados por middleware
    const { slug } = ctx.params;
    const fecha = typeof ctx.query.fecha === 'string' ? ctx.query.fecha : undefined;
    const dias = ctx.query.dias !== undefined ? Number(ctx.query.dias) : 1;
    const data = await adminAgenda(strapi, slug, { fecha, dias });
    ctx.send({ data });
  }),

  adminWalkIn: asyncHandler(async (ctx) => {
    const { slug } = ctx.params;
    const body = ctx.request.body || {};
    const data = await adminWalkIn(strapi, slug, body);
    ctx.send({ data });
  }),

  adminCreateBloqueo: asyncHandler(async (ctx) => {
    const { slug } = ctx.params;
    const body = ctx.request.body || {};
    const data = await adminCreateBloqueo(strapi, slug, body);
    ctx.send({ data });
  }),

  adminDeleteBloqueo: asyncHandler(async (ctx) => {
    const { slug, documentId } = ctx.params;
    const data = await adminDeleteBloqueo(strapi, slug, documentId);
    ctx.send({ data });
  }),

  adminCancelReserva: asyncHandler(async (ctx) => {
    const { slug, documentId } = ctx.params;
    const data = await adminCancelReserva(strapi, slug, documentId);
    ctx.send({ data });
  }),

  adminGetConfig: asyncHandler(async (ctx) => {
    const data = await adminGetConfig(strapi, ctx.params.slug);
    ctx.send({ data });
  }),

  adminUpdateConfig: asyncHandler(async (ctx) => {
    const data = await adminUpdateConfig(
      strapi,
      ctx.params.slug,
      ctx.request.body || {},
      (ctx.request as any).files
    );
    ctx.send({ data });
  }),

  publicCancelInfo: asyncHandler(async (ctx) => {
    const token = String(ctx.query.token || '');
    const data = await getReservaCancelContact(strapi, {
      token,
      slug: String(ctx.params.slug || ''),
    });
    ctx.send({ data });
  }),

  /** Self-service de baja deshabilitado: solo contacto WhatsApp (ver cancelar-info). */
  publicCancel: asyncHandler(async (ctx) => {
    const token =
      (typeof ctx.query.token === 'string' && ctx.query.token) ||
      ctx.request.body?.token;
    if (token && !verifyReservaCancelToken(String(token))) {
      throw new ValidationError('token inválido o vencido');
    }
    throw new ForbiddenError(
      'La cancelación online automática está deshabilitada. Usá el link del mail para contactar al local por WhatsApp.'
    );
  }),
}));
