import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const payload = ctx.request.body?.payload;
    if (typeof payload !== 'string' || !payload.trim()) {
      throw new ValidationError('payload es requerido');
    }
    await next();
  };
};
