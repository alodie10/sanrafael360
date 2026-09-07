import { ValidationError } from '../../../utils/errors';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const estado = ctx.request.body?.estado;
    if (!estado || typeof estado !== 'string') {
      throw new ValidationError('estado es requerido');
    }
    await next();
  };
};
