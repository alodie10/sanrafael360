import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (body.monto == null || Number.isNaN(Number(body.monto))) {
      throw new ValidationError('monto es requerido y debe ser numérico');
    }
    if (!body.negocio || typeof body.negocio !== 'string') {
      throw new ValidationError('negocio (documentId) es requerido');
    }
    await next();
  };
};
