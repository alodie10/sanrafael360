import { ValidationError } from '../../../utils/errors';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (ctx.request.method === 'POST' && (!body.key || typeof body.key !== 'string')) {
      throw new ValidationError('key es requerida');
    }
    await next();
  };
};
