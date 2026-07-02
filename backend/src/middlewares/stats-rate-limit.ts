import { ValidationError } from '../utils/errors';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return ctx.request.ip || 'unknown';
}

/**
 * Rate-limit básico para POST /negocios/:id/stats (SEC-06).
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

    const key = `${getClientIp(ctx)}:${id}:${type}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count += 1;
      if (entry.count > MAX_REQUESTS) {
        strapi.log.warn(`[StatsRateLimit] Bloqueado: ${key}`);
        ctx.status = 429;
        ctx.body = { error: { message: 'Demasiadas solicitudes. Intentá más tarde.' } };
        return;
      }
    }

    await next();
  };
};
