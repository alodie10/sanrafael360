import { factories } from '@strapi/strapi';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { createPagoRepository } from '../repositories/pago-repository';
import { NotFoundError } from '../../../utils/errors';
import { processPaymentSuccess } from '../../../services/payment-success-handler';

// Anti-race en memoria para evitar dobles activaciones/creaciones si llegan webhooks simultáneos.
// Nota: esto no reemplaza un unique index en BD, pero reduce el riesgo en la práctica.
const inFlightMpPaymentIds = new Set<string>();

export default factories.createCoreService('api::pago.pago', ({ strapi }) => ({
  /**
   * Genera una preferencia de pago en Mercado Pago
   */
  async createPreference(negocioId: string, planType: string = 'Mensual') {
    const pagoRepo = createPagoRepository(strapi);
    const negocioRepo = createNegocioRepository(strapi);

    strapi.log.info(`[MP] Iniciando preferencia para NegocioID: ${negocioId}, Plan: ${planType}`);
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:1337';

    strapi.log.info(`[MP DIAGNOSTIC] Token Presente: ${!!accessToken}`);
    strapi.log.info(`[MP DIAGNOSTIC] FRONTEND_URL: ${appUrl}`);
    strapi.log.info(`[MP DIAGNOSTIC] BACKEND_URL: ${backendUrl}`);

    if (!accessToken) {
      strapi.log.error('[MP ERROR] MP_ACCESS_TOKEN is missing in environment variables!');
      throw new Error(
        'Mercado Pago Access Token no configurado en variables de entorno (MP_ACCESS_TOKEN)'
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const negocio = await negocioRepo.findById(negocioId);
    if (!negocio) throw new NotFoundError('Negocio');

    const config = await pagoRepo.findSubscriptionConfig();
    const isTestMode = config?.modo_prueba || false;
    const amount =
      planType === 'Semestral'
        ? config?.precio_semestral || 50000
        : config?.precio_mensual || 1200;

    if (isTestMode) {
      strapi.log.info(`[MP SIMULATION] Modo prueba activo. Simulando éxito para ${negocio.nombre}`);
      await this.handlePaymentSuccess(negocio.documentId, 'SIMULATED_PAYMENT_' + Date.now());
      return {
        id: 'simulated_id',
        init_point: `${appUrl}/portal?payment=success&simulated=true`,
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
            plan_type: planType,
          },
        },
      });

      strapi.log.info(`[MP] Preferencia creada (${planType}): ${result.id} por $${amount}`);

      await pagoRepo.create({
        monto: amount,
        estado: 'pendiente',
        mp_preference_id: result.id,
        negocio: negocio.id,
        external_reference: negocio.documentId,
        publishedAt: new Date(),
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
    return processPaymentSuccess(
      {
        pagoRepo: createPagoRepository(strapi),
        negocioRepo: createNegocioRepository(strapi),
      },
      strapi.log,
      externalReference,
      paymentId,
      mpPayload
    );
  },

  /**
   * Consulta a MP por un pago específico y lo procesa (idempotente por mp_payment_id).
   */
  async processPaymentNotification(paymentId: string) {
    const pagoRepo = createPagoRepository(strapi);
    const paymentIdStr = String(paymentId);

    const alreadyProcessed = await this.isPaymentAlreadyApproved(paymentIdStr);
    if (alreadyProcessed) {
      strapi.log.info(`[MP Service] Pago ${paymentIdStr} ya procesado — idempotencia OK`);
      return { duplicate: true };
    }

    if (inFlightMpPaymentIds.has(paymentIdStr)) {
      strapi.log.info(`[MP Service] Pago ${paymentIdStr} en vuelo — skip (anti-race)`);
      return { duplicate: true, inFlight: true };
    }
    inFlightMpPaymentIds.add(paymentIdStr);

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
        strapi.log.info(
          `[MP Service] Pago ${paymentIdStr} tiene estado: ${data.status}. No se activa nada.`
        );
        await this.updatePaymentStatusFromMp(paymentIdStr, data);
      }

      return { processed: true, status: data.status };
    } catch (error: any) {
      strapi.log.error(
        `[MP Service Error] Error al consultar pago ${paymentIdStr}: ${error.message}`
      );
      throw error;
    } finally {
      inFlightMpPaymentIds.delete(paymentIdStr);
    }
  },

  async isPaymentAlreadyApproved(mpPaymentId: string): Promise<boolean> {
    const pagoRepo = createPagoRepository(strapi);
    const existing = await pagoRepo.findApprovedByMpPaymentId(mpPaymentId);
    return existing != null;
  },

  async updatePaymentStatusFromMp(mpPaymentId: string, mpData: unknown) {
    const pagoRepo = createPagoRepository(strapi);
    const row = (await pagoRepo.findByMpPaymentId(mpPaymentId))[0];
    if (!row) return;

    const payload = mpData as { status?: string };
    const estadoMap = {
      rejected: 'rechazado',
      cancelled: 'cancelado',
      pending: 'pendiente',
      in_process: 'pendiente',
    } as const;
    const mpStatus = payload.status ?? '';
    const mapped = estadoMap[mpStatus as keyof typeof estadoMap];
    const estado = mapped ?? row.estado;

    await pagoRepo.update(row.documentId, {
      estado,
      detalles_mp: JSON.parse(JSON.stringify(mpData)),
    });
  },
}));
