import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('rating debe ser un entero entre 1 y 5');
    }

    if (!body.comentario || typeof body.comentario !== 'string' || body.comentario.trim().length < 3) {
      throw new ValidationError('comentario debe tener al menos 3 caracteres');
    }

    if (!body.negocio || typeof body.negocio !== 'string' || !body.negocio.trim()) {
      throw new ValidationError('negocio es requerido');
    }

    await next();
  };
};
