import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::pago.pago', ({ strapi }) => ({
  /**
   * Crea una preferencia de pago para un negocio
   */
  async createPreference(ctx) {
    try {
      const { negocioId, planType } = ctx.request.body;

      if (!negocioId) {
        return ctx.badRequest('negocioId es requerido');
      }

      const result = await strapi.service('api::pago.pago').createPreference(negocioId, planType);
      return ctx.send({ success: true, data: result });
    } catch (err: any) {
      strapi.log.error(err);
      return ctx.internalServerError(err.message);
    }
  },

  /**
   * Endpoint especial para SIMULAR un éxito de pago en LOCAL
   */
  async simulateSuccess(ctx) {
    try {
      const { externalReference } = ctx.request.body;
      if (!externalReference) return ctx.badRequest('externalReference requerido');
      
      const result = await strapi.service('api::pago.pago').handlePaymentSuccess(externalReference, 'SIMULATED_PAYMENT_123');
      return ctx.send(result);
    } catch (err: any) {
      return ctx.internalServerError(err.message);
    }
  },

  /**
   * Recibe notificaciones de Mercado Pago (Webhook)
   */
  async webhook(ctx) {
    try {
      const { query } = ctx;
      const paymentId = query.id || ctx.request.body.data?.id;
      const type = query.type || ctx.request.body.type;

      if (type === 'payment' && paymentId) {
        strapi.log.info(`[MP Webhook] Recibido pago ID: ${paymentId}. Validando...`);
        
        // Llamamos al servicio para que hable con MP y actualice el negocio
        await strapi.service('api::pago.pago').processPaymentNotification(paymentId);
      }

      return ctx.send({ received: true });
    } catch (err: any) {
      strapi.log.error(`[MP Webhook Error] ${err.message}`);
      return ctx.send({ received: true }); // MP exige un 200/OK siempre
    }
  }
}));
