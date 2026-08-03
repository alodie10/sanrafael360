import { UnauthorizedError } from '../utils/errors';
import { verifyMpWebhookSignature } from '../utils/mercadopago-webhook-signature';

/**
 * Valida firma HMAC de webhooks Mercado Pago (SEC-03).
 * En desarrollo sin MP_WEBHOOK_SECRET: omite validación con warning.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const secret = process.env.MP_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (isProduction) {
        throw new UnauthorizedError('MP_WEBHOOK_SECRET no configurado');
      }
      strapi.log.warn(
        '[MP Webhook] MP_WEBHOOK_SECRET ausente — validación de firma omitida (solo desarrollo)'
      );
      await next();
      return;
    }

    const query = ctx.query ?? {};
    // Manifest de x-signature: solo `data.id` (docs MP). NO usar query.id (IPN legacy):
    // si se incluye, el HMAC no coincide y cae 401 aunque el pago sea válido.
    const dataIdRaw = query['data.id'] ?? ctx.request.body?.data?.id;
    const xSignature = ctx.request.headers['x-signature'] as string | undefined;
    const xRequestId = ctx.request.headers['x-request-id'] as string | undefined;

    const result = verifyMpWebhookSignature({
      dataId: dataIdRaw != null ? String(dataIdRaw) : undefined,
      xRequestId,
      xSignature,
      secret,
    });

    if (!result.valid) {
      const reason = 'reason' in result ? result.reason : 'firma inválida';
      strapi.log.warn(`[MP Webhook] Firma rechazada: ${reason}`);
      throw new UnauthorizedError('Firma de webhook inválida');
    }

    await next();
  };
};
