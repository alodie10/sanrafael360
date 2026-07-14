import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { documentId } = ctx.params || {};
    const { negocioIds } = ctx.request.body || {};

    if (!documentId || typeof documentId !== 'string') {
      throw new ValidationError('documentId es requerido');
    }
    if (!Array.isArray(negocioIds) || negocioIds.length === 0) {
      throw new ValidationError('negocioIds debe ser un array no vacío');
    }

    await next();
  };
};
