import { factories } from '@strapi/strapi';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export default factories.createCoreService('api::pago.pago', ({ strapi }) => ({
  /**
   * Genera una preferencia de pago en Mercado Pago
   */
  async createPreference(negocioId: string, planType: string = 'Mensual') {
    strapi.log.info(`[MP] Iniciando preferencia para NegocioID: ${negocioId}, Plan: ${planType}`);
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:1337";
    
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

    // 1. Obtener configuración de precios y modo prueba
    const config = await strapi.documents('api::suscripcion-config.suscripcion-config').findFirst();
    const isTestMode = config?.modo_prueba || false;
    const amount = planType === 'Semestral' 
      ? (config?.precio_semestral || 50000) 
      : (config?.precio_mensual || 1200);

    // 2. Si estamos en modo prueba, simulamos el éxito de inmediato
    if (isTestMode) {
      strapi.log.info(`[MP SIMULATION] Modo prueba activo. Simulando éxito para ${negocio.nombre}`);
      
      // Activamos el negocio directamente (como si el webhook hubiera llegado)
      await this.handlePaymentSuccess(negocio.documentId, 'SIMULATED_PAYMENT_' + Date.now());
      
      return {
        id: 'simulated_id',
        init_point: `${appUrl}/portal?payment=success&simulated=true`
      };
    }

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: negocio.documentId,
              title: `Suscripción Premium San Rafael 360 - ${planType} - ${negocio.nombre}`,
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
          notification_url: `${backendUrl}/api/pagos/webhook`,
          external_reference: negocio.documentId,
          metadata: {
            plan_type: planType
          }
        },
      });

      strapi.log.info(`[MP] Preferencia creada (${planType}): ${result.id} por $${amount}`);
      
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
  async handlePaymentSuccess(
    externalReference: string,
    paymentId: string,
    mpPayload?: unknown
  ) {
    const paymentIdStr = String(paymentId);

    if (await this.isPaymentAlreadyApproved(paymentIdStr)) {
      strapi.log.info(`[PagoSuccess] Pago ${paymentIdStr} ya estaba aprobado — skip`);
      return { success: true, duplicate: true };
    }

    strapi.log.info(`[PagoSuccess] Activando premium para negocio: ${externalReference}`);

    const negocio = await strapi.documents('api::negocio.negocio').findOne({
      documentId: externalReference,
    });

    if (!negocio) {
      strapi.log.error(`[PagoSuccess] Negocio ${externalReference} no encontrado`);
      return;
    }

    // 1. Obtener configuración para ver cuántos días sumar
    const config = await strapi.documents('api::suscripcion-config.suscripcion-config').findFirst();
    
    // Buscamos el pago para ver qué plan era
    const pagoPendiente = await strapi.documents('api::pago.pago').findMany({
      filters: { external_reference: externalReference, estado: 'pendiente' },
      sort: 'createdAt:desc',
      limit: 1
    });

    const isSemestral = pagoPendiente[0]?.monto >= (config?.precio_semestral || 50000);
    const diasSumar = isSemestral 
      ? (config?.dias_semestral || 180) 
      : (config?.dias_mensual || 30);

    // 2. Calculamos fechas
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(now.getDate() + diasSumar);

    // 3. Actualizamos el negocio a Premium
    await strapi.documents('api::negocio.negocio').update({
      documentId: externalReference,
      data: {
        is_premium: true,
        premium_since: now,
        premium_valid_until: validUntil,
        publishedAt: now,
      }
    });

    const mpDetails = mpPayload != null ? JSON.parse(JSON.stringify(mpPayload)) : undefined;

    // 4. Actualizamos el registro del pago
    if (pagoPendiente.length > 0) {
      await strapi.documents('api::pago.pago').update({
        documentId: pagoPendiente[0].documentId,
        data: {
          estado: 'aprobado',
          mp_payment_id: paymentIdStr,
          fecha_pago: now,
          ...(mpDetails ? { detalles_mp: mpDetails } : {}),
        },
      });
    } else {
      await strapi.documents('api::pago.pago').create({
        data: {
          monto: 0,
          estado: 'aprobado',
          mp_payment_id: paymentIdStr,
          external_reference: externalReference,
          fecha_pago: now,
          negocio: negocio.id,
          publishedAt: now,
          ...(mpDetails ? { detalles_mp: mpDetails } : {}),
        },
      });
    }

    strapi.log.info(`[PagoSuccess] Negocio ${negocio.nombre} ahora es PREMIUM hasta ${validUntil.toLocaleDateString()}`);
    return { success: true, negocio: negocio.nombre };
  },

  /**
   * Consulta a MP por un pago específico y lo procesa (idempotente por mp_payment_id).
   */
  async processPaymentNotification(paymentId: string) {
    const paymentIdStr = String(paymentId);

    const alreadyProcessed = await this.isPaymentAlreadyApproved(paymentIdStr);
    if (alreadyProcessed) {
      strapi.log.info(`[MP Service] Pago ${paymentIdStr} ya procesado — idempotencia OK`);
      return { duplicate: true };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    try {
      const data = await payment.get({ id: paymentIdStr });

      if (data.status === 'approved') {
        const externalReference = data.external_reference;
        if (externalReference) {
          strapi.log.info(`[MP Service] Pago ${paymentIdStr} APROBADO. Activando negocio...`);
          await this.handlePaymentSuccess(externalReference, paymentIdStr, data);
        }
      } else {
        strapi.log.info(`[MP Service] Pago ${paymentIdStr} tiene estado: ${data.status}. No se activa nada.`);
        await this.updatePaymentStatusFromMp(paymentIdStr, data);
      }

      return { processed: true, status: data.status };
    } catch (error: any) {
      strapi.log.error(`[MP Service Error] Error al consultar pago ${paymentIdStr}: ${error.message}`);
      throw error;
    }
  },

  async isPaymentAlreadyApproved(mpPaymentId: string): Promise<boolean> {
    const existing = await strapi.documents('api::pago.pago').findMany({
      filters: { mp_payment_id: mpPaymentId, estado: 'aprobado' },
      limit: 1,
    });
    return existing.length > 0;
  },

  async updatePaymentStatusFromMp(mpPaymentId: string, mpData: unknown) {
    const rows = await strapi.documents('api::pago.pago').findMany({
      filters: { mp_payment_id: mpPaymentId },
      limit: 1,
    });

    if (rows.length === 0) return;

    const payload = mpData as { status?: string };
    const estadoMap = {
      rejected: 'rechazado',
      cancelled: 'cancelado',
      pending: 'pendiente',
      in_process: 'pendiente',
    } as const;
    const mpStatus = payload.status ?? '';
    const mapped = estadoMap[mpStatus as keyof typeof estadoMap];
    const estado = mapped ?? rows[0].estado;

    await strapi.documents('api::pago.pago').update({
      documentId: rows[0].documentId,
      data: {
        estado,
        detalles_mp: JSON.parse(JSON.stringify(mpData)),
      },
    });
  },
}));
