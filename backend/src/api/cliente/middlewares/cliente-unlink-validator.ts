import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { documentId } = ctx.params || {};
    const { negocioId } = ctx.request.body || {};

    if (!documentId || typeof documentId !== 'string') {
      throw new ValidationError('documentId es requerido');
    }
    if (!negocioId || typeof negocioId !== 'string') {
      throw new ValidationError('negocioId es requerido');
    }

    await next();
  };
};
