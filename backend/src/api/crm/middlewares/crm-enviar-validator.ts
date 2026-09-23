import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const id = ctx.request.body?.contactoDocumentId;
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('contactoDocumentId es requerido');
    }
    const index = ctx.request.body?.plantillaIndex;
    if (index != null && index !== '' && Number.isNaN(Number(index))) {
      throw new ValidationError('plantillaIndex inválido');
    }
    await next();
  };
};
