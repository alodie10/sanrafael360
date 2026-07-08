import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';

export default factories.createCoreController('api::pago.pago', ({ strapi }) => ({
  createPreference: asyncHandler(async (ctx) => {
    const { negocioId, planType } = ctx.request.body;
    const result = await strapi.service('api::pago.pago').createPreference(negocioId, planType);
    ctx.send({ success: true, data: result });
  }),

  /**
   * Endpoint especial para SIMULAR un éxito de pago en LOCAL
   * Bloqueado en producción (SEC-02).
   */
  simulateSuccess: asyncHandler(async (ctx) => {
    if (process.env.NODE_ENV === 'production') {
      ctx.forbidden('La simulación de pagos está deshabilitada en producción');
      return;
    }

    const { externalReference } = ctx.request.body;
    if (!externalReference) {
      throw new ValidationError('externalReference requerido');
    }

    const result = await strapi
      .service('api::pago.pago')
      .handlePaymentSuccess(externalReference, 'SIMULATED_PAYMENT_' + Date.now());
    ctx.send(result);
  }),

  /**
   * Recibe notificaciones de Mercado Pago (Webhook).
   * Firma validada por middleware global::mercadopago-webhook (SEC-03).
   */
  webhook: asyncHandler(async (ctx) => {
    const { query } = ctx;
    const paymentId = query.id || query['data.id'] || ctx.request.body?.data?.id;
    const type = query.type || query.topic || ctx.request.body?.type;

    if ((type === 'payment' || query.topic === 'payment') && paymentId) {
      strapi.log.info(`[MP Webhook] Notificación de pago ID: ${paymentId}`);
      await strapi.service('api::pago.pago').processPaymentNotification(String(paymentId));
    } else {
      strapi.log.info(`[MP Webhook] Notificación ignorada (type=${type ?? 'n/a'})`);
    }

    // MP requiere 200 para dejar de reintentar
    ctx.send({ received: true });
  }),
}));
