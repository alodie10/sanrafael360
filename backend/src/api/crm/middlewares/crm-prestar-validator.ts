import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const nombre = String(ctx.request.body?.nombre || '').trim();
    const owner_email = String(ctx.request.body?.owner_email || '').trim();
    if (!nombre) throw new ValidationError('nombre es requerido');
    if (!owner_email) throw new ValidationError('owner_email es requerido');
    await next();
  };
};
