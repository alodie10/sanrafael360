import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const id = ctx.request.body?.contactoDocumentId;
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('contactoDocumentId es requerido');
    }
    await next();
  };
};
