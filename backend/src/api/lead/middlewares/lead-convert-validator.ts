import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const leadDocumentId = ctx.params?.id;
    const body = ctx.request.body || {};
    const negocioId = body?.negocioId;

    if (!leadDocumentId || typeof leadDocumentId !== 'string' || !leadDocumentId.trim()) {
      throw new ValidationError('ID del lead es requerido');
    }

    if (!negocioId || typeof negocioId !== 'string' || !negocioId.trim()) {
      throw new ValidationError('negocioId es requerido');
    }

    await next();
  };
};

