import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::pago.pago', ({ strapi }) => ({
  /**
   * Crea una preferencia de pago para un negocio
   */
  async createPreference(ctx) {
    const { negocioId, planType } = ctx.request.body;

    if (!negocioId) {
      return ctx.badRequest('negocioId es requerido');
    }

    try {
      const result = await strapi.service('api::pago.pago').createPreference(negocioId, planType);
      return ctx.send({ success: true, data: result });
    } catch (err: any) {
      return ctx.internalServerError(err.message);
    }
  },

  /**
   * Recibe notificaciones de Mercado Pago (Webhook)
   */
  async webhook(ctx) {
    const { query } = ctx;
    const topic = query.topic || query.type;
    const id = query.id || ctx.request.body.data?.id;

    console.log(`[MP Webhook] Notificación recibida: ${topic} ID: ${id}`);

    // Solo nos interesan los pagos aprobados
    if (topic === 'payment' || topic === 'payment_intent') {
       // Aquí irá la lógica para validar el pago y activar el Premium
       // Por ahora devolvemos 200 para que MP no reintente
    }

    return ctx.send({ received: true });
  }
}));
