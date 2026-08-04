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
import { adminCreateComercio as createReservaComercioModulo } from '../services/admin-alta-comercio';
import {
  startMpOauth,
  completeMpOauth,
  disconnectMpOauth,
  peekSlugFromOauthState,
} from '../services/mp-oauth';
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
      metodo_pago: body.metodo_pago,
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

  adminCreateComercio: asyncHandler(async (ctx) => {
    const data = await createReservaComercioModulo(strapi, ctx.request.body || {});
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
    const access = (ctx.state.reservaAccess || { role: 'owner' }) as {
      role: 'admin' | 'owner';
    };
    const data = await adminGetConfig(strapi, ctx.params.slug, access);
    ctx.send({ data });
  }),

  adminUpdateConfig: asyncHandler(async (ctx) => {
    const access = (ctx.state.reservaAccess || { role: 'owner' }) as {
      role: 'admin' | 'owner';
    };
    const data = await adminUpdateConfig(
      strapi,
      ctx.params.slug,
      ctx.request.body || {},
      (ctx.request as any).files,
      access
    );
    ctx.send({ data });
  }),

  adminMpOauthStart: asyncHandler(async (ctx) => {
    const user = ctx.state.user;
    if (!user?.id) throw new ForbiddenError('Debes iniciar sesión');
    const data = await startMpOauth(strapi, ctx.params.slug, { id: user.id });
    ctx.send({ data });
  }),

  adminMpOauthDisconnect: asyncHandler(async (ctx) => {
    const data = await disconnectMpOauth(strapi, ctx.params.slug);
    ctx.send({ data });
  }),

  mpOauthCallback: asyncHandler(async (ctx) => {
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const stateRaw = typeof ctx.query.state === 'string' ? ctx.query.state : undefined;
    try {
      const result = await completeMpOauth(strapi, {
        code: typeof ctx.query.code === 'string' ? ctx.query.code : undefined,
        state: stateRaw,
        error: typeof ctx.query.error === 'string' ? ctx.query.error : undefined,
      });
      ctx.redirect(
        `${frontend}/portal/reservas/${encodeURIComponent(result.slug)}?tab=config&mp_oauth=ok`
      );
    } catch (err: any) {
      const msg = encodeURIComponent(err?.message || 'oauth_error');
      const slug = peekSlugFromOauthState(stateRaw);
      if (slug) {
        ctx.redirect(
          `${frontend}/portal/reservas/${encodeURIComponent(slug)}?tab=config&mp_oauth=error&msg=${msg}`
        );
        return;
      }
      ctx.redirect(`${frontend}/portal/reservas?mp_oauth=error&msg=${msg}`);
    }
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
