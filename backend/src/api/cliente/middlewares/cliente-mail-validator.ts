import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (!body.subject || typeof body.subject !== 'string' || !body.subject.trim()) {
      throw new ValidationError('subject es requerido');
    }
    if (!body.bodyHtml || typeof body.bodyHtml !== 'string' || !body.bodyHtml.trim()) {
      throw new ValidationError('bodyHtml es requerido');
    }

    const path = ctx.request.path || '';
    if (path.includes('/mail/broadcast')) {
      const audience = body.audience || 'all';
      if (audience !== 'all' && audience !== 'selected') {
        throw new ValidationError('audience debe ser all o selected');
      }
      if (audience === 'selected' && (!Array.isArray(body.documentIds) || body.documentIds.length === 0)) {
        throw new ValidationError('documentIds es obligatorio cuando audience=selected');
      }
    }

    await next();
  };
};
