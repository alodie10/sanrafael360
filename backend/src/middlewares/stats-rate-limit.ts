import { ValidationError } from '../utils/errors';
import { clientIpFromKoa } from '../utils/client-ip';
import { hitMemoryRateLimit } from '../utils/memory-rate-limit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

/**
 * Rate-limit para POST /negocios/:id/stats (SEC-06).
 * Máx. 60 eventos por minuto por IP + negocio.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { id } = ctx.params;
    const { type } = ctx.request.body || {};

    if (!id) throw new ValidationError('ID de negocio requerido');
    if (!['view', 'whatsapp', 'website'].includes(type)) {
      throw new ValidationError('Tipo de estadística inválido');
    }

    const key = `${clientIpFromKoa(ctx)}:${id}:${type}`;
    if (!hitMemoryRateLimit(key, MAX_REQUESTS, WINDOW_MS)) {
      strapi.log.warn(`[StatsRateLimit] Bloqueado: ${key}`);
      ctx.status = 429;
      ctx.body = { error: { message: 'Demasiadas solicitudes. Intentá más tarde.' } };
      return;
    }

    await next();
  };
};
