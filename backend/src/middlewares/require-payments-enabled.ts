import { ForbiddenError } from '../utils/errors';

/**
 * Kill switch de seguridad para reducir superficie de ataque cuando no se usan pagos.
 *
 * Reglas:
 * - Si ENABLE_PAYMENTS no está definida: se permite (modo compatibilidad).
 * - Si ENABLE_PAYMENTS está en '0' o 'false' (case-insensitive): bloquea rutas públicas de pagos.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const raw = process.env.ENABLE_PAYMENTS;

    if (raw == null || raw === '') {
      await next();
      return;
    }

    const normalized = String(raw).trim().toLowerCase();
    const disabled = normalized === '0' || normalized === 'false';

    if (disabled) {
      strapi.log.warn(`[Payments] Kill switch activo (ENABLE_PAYMENTS=${raw}). Bloqueando ${ctx.method} ${ctx.path}`);
      throw new ForbiddenError('Pagos deshabilitados en este entorno');
    }

    await next();
  };
};

