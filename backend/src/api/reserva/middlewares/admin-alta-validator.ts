import { ValidationError } from '../../../utils/errors';

/**
 * Valida body de POST /reservas/admin/comercios (alta E1).
 */
export default (_config: unknown, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (!body.negocioDocumentId || !String(body.negocioDocumentId).trim()) {
      throw new ValidationError('negocioDocumentId requerido');
    }
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
    if (body.cantidad_recursos !== undefined) {
      const n = Number(body.cantidad_recursos);
      if (!Number.isFinite(n) || n < 1 || n > 40) {
        throw new ValidationError('cantidad_recursos debe ser entre 1 y 40');
      }
    }
    if (body.recursos !== undefined) {
      if (!Array.isArray(body.recursos) || !body.recursos.length) {
        throw new ValidationError('recursos debe ser un array no vacío');
      }
      if (body.recursos.length > 40) {
        throw new ValidationError('Máximo 40 recursos');
      }
    }
    if (body.slug !== undefined && body.slug !== null && String(body.slug).trim()) {
      const slug = String(body.slug).trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
        throw new ValidationError('slug inválido (usar letras, números y guiones)');
      }
    }
    await next();
  };
};
