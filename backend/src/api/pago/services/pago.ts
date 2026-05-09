import { factories } from '@strapi/strapi';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export default factories.createCoreService('api::pago.pago', ({ strapi }) => ({
  /**
   * Genera una preferencia de pago en Mercado Pago
   */
  async createPreference(negocioId: string, planType: string = 'Mensual') {
    strapi.log.info(`[MP] Iniciando preferencia para NegocioID: ${negocioId}, Plan: ${planType}`);
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.FRONTEND_URL;
    const backendUrl = process.env.BACKEND_URL;
    
    strapi.log.info(`[MP DIAGNOSTIC] Token Presente: ${!!accessToken}`);
    strapi.log.info(`[MP DIAGNOSTIC] FRONTEND_URL: ${appUrl}`);
    strapi.log.info(`[MP DIAGNOSTIC] BACKEND_URL: ${backendUrl}`);
    
    if (!accessToken) {
      strapi.log.error("[MP ERROR] MP_ACCESS_TOKEN is missing in environment variables!");
      throw new Error('Mercado Pago Access Token no configurado en variables de entorno (MP_ACCESS_TOKEN)');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const negocio = await strapi.documents('api::negocio.negocio').findOne({
      documentId: negocioId,
    });

    if (!negocio) throw new Error('Negocio no encontrado');

    const amount = planType === 'Anual' ? 10000 : 1200;

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: negocio.documentId,
              title: `Suscripción Premium San Rafael 360 - ${negocio.nombre}`,
              quantity: 1,
              unit_price: amount,
              currency_id: 'ARS',
            },
          ],
          back_urls: {
            success: `${appUrl}/portal?payment=success`,
            failure: `${appUrl}/portal?payment=failure`,
            pending: `${appUrl}/portal?payment=pending`,
          },
          auto_return: 'approved',
          notification_url: `${backendUrl}/api/pago/webhook`,
          external_reference: negocio.documentId,
        },
      });

      strapi.log.info(`[MP] Preferencia creada con éxito: ${result.id}`);
      
      await strapi.documents('api::pago.pago').create({
        data: {
          monto: amount,
          estado: 'pendiente',
          mp_preference_id: result.id,
          negocio: negocio.id,
          external_reference: negocio.documentId,
          publishedAt: new Date(),
        }
      });

      return result;
    } catch (error: any) {
      strapi.log.error(`[MP Error] Falló al crear preferencia: ${error.message}`);
      if (error.body) {
        strapi.log.error(`[MP Error Detail] ${JSON.stringify(error.body)}`);
      }
      throw error;
    }
  },

  /**
   * Procesa un pago aprobado y activa el premium
   */
  async handlePaymentSuccess(externalReference: string, paymentId: string) {
    strapi.log.info(`[PagoSuccess] Activando premium para negocio: ${externalReference}`);

    const negocio = await strapi.documents('api::negocio.negocio').findOne({
      documentId: externalReference,
    });

    if (!negocio) {
      strapi.log.error(`[PagoSuccess] Negocio ${externalReference} no encontrado`);
      return;
    }

    // 1. Calculamos fechas (30 días de premium)
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(now.getDate() + 30);

    // 2. Actualizamos el negocio a Premium
    await strapi.documents('api::negocio.negocio').update({
      documentId: externalReference,
      data: {
        is_premium: true,
        premium_since: now,
        premium_valid_until: validUntil,
        publishedAt: now,
      }
    });

    // 3. Actualizamos el registro del pago
    const pagos = await strapi.documents('api::pago.pago').findMany({
      filters: { external_reference: externalReference, estado: 'pendiente' },
      sort: 'createdAt:desc',
      limit: 1
    });

    if (pagos.length > 0) {
      await strapi.documents('api::pago.pago').update({
        documentId: pagos[0].documentId,
        data: {
          estado: 'aprobado',
          mp_payment_id: paymentId,
        }
      });
    }

    strapi.log.info(`[PagoSuccess] Negocio ${negocio.nombre} ahora es PREMIUM hasta ${validUntil.toLocaleDateString()}`);
    return { success: true, negocio: negocio.nombre };
  },

  /**
   * Consulta a MP por un pago específico y lo procesa
   */
  async processPaymentNotification(paymentId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    try {
      const data = await payment.get({ id: paymentId });
      
      if (data.status === 'approved') {
        const externalReference = data.external_reference;
        if (externalReference) {
          strapi.log.info(`[MP Service] Pago ${paymentId} APROBADO. Activando negocio...`);
          await this.handlePaymentSuccess(externalReference, paymentId.toString());
        }
      } else {
        strapi.log.info(`[MP Service] Pago ${paymentId} tiene estado: ${data.status}. No se activa nada.`);
      }
    } catch (error: any) {
      strapi.log.error(`[MP Service Error] Error al consultar pago ${paymentId}: ${error.message}`);
    }
  }
}));
