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
   * Recibe notificaciones de Mercado Pago (Webhook)
   */
  async webhook(ctx) {
    try {
      const { query } = ctx;
      const topic = query.topic || query.type;
      const id = query.id || ctx.request.body.data?.id;

      strapi.log.info(`[MP Webhook] Notificación recibida: ${topic} ID: ${id}`);

      return ctx.send({ received: true });
    } catch (err: any) {
      strapi.log.error(err);
      return ctx.send({ received: true }); // Siempre devolvemos 200 a MP para evitar reintentos infinitos
    }
  }
}));
