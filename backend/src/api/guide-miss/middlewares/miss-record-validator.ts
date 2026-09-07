import { ValidationError } from '../../../utils/errors';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const raw = ctx.request.body?.raw_query;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      throw new ValidationError('raw_query es requerido');
    }
    await next();
  };
};
