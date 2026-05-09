import { factories } from '@strapi/strapi';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default factories.createCoreService('api::pago.pago', ({ strapi }) => ({
  /**
   * Genera una preferencia de pago en Mercado Pago
   */
  async createPreference(negocioId: string, planType: string = 'Mensual') {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    if (!accessToken || accessToken === 'TU_ACCESS_TOKEN_AQUI') {
      throw new Error('Mercado Pago Access Token no configurado');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // Buscamos el negocio para tener sus datos
    const negocio = await strapi.documents('api::negocio.negocio').findOne({
      documentId: negocioId,
    });

    if (!negocio) throw new Error('Negocio no encontrado');

    const amount = planType === 'Anual' ? 10000 : 1200; // Precios de ejemplo

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
          success: `${process.env.NEXT_PUBLIC_APP_URL}/portal?payment=success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/portal?payment=failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/portal?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.STRAPI_BACKEND_URL || 'https://tu-url.com'}/api/pagos/webhook`,
        external_reference: negocio.documentId,
      },
    });

    // Guardamos el registro del pago como "pendiente"
    await strapi.documents('api::pago.pago').create({
      data: {
        monto: amount,
        estado: 'pendiente',
        mp_preference_id: result.id,
        negocio: negocio.id,
        external_reference: negocio.documentId,
      }
    });

    return result;
  },
}));
