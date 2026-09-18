import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const nombre = String(ctx.request.body?.nombre || '').trim();
    if (!nombre) throw new ValidationError('nombre es requerido');
    await next();
  };
};
