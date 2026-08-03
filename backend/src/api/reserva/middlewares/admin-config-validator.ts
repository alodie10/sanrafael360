import { ValidationError } from '../../../utils/errors';

/**
 * Valida body de PUT config admin.
 * multipart: campos vienen como string; JSON: objetos nativos.
 */
export default (_config: unknown, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (body.precio_ars !== undefined) {
      const n = Number(body.precio_ars);
      if (!Number.isFinite(n) || n <= 0) {
        throw new ValidationError('precio_ars debe ser > 0');
      }
    }
    if (body.duracion_minutos !== undefined) {
      const n = Number(body.duracion_minutos);
      if (!Number.isFinite(n) || n < 15) {
        throw new ValidationError('duracion_minutos inválida');
      }
    }
    if (body.horario !== undefined && typeof body.horario === 'string') {
      try {
        JSON.parse(body.horario);
      } catch {
        throw new ValidationError('horario JSON inválido');
      }
    }
    if (body.mp_access_token !== undefined && body.mp_access_token !== null) {
      const raw = String(body.mp_access_token).trim();
      const clearing =
        body.mp_access_token_clear === true ||
        body.mp_access_token_clear === 'true' ||
        body.mp_access_token_clear === '1';
      if (!clearing && raw && raw.length < 20) {
        throw new ValidationError('Access Token MP inválido (muy corto)');
      }
    }
    await next();
  };
};
