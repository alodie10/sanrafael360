import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const mensaje = ctx.request.body?.mensaje;
    if (typeof mensaje !== 'string' || !mensaje.trim()) {
      throw new ValidationError('mensaje es requerido');
    }
    await next();
  };
};
