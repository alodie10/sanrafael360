import { ValidationError } from '../../../utils/errors';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (ctx.request.method === 'POST' && (!body.titulo || !body.cuerpo)) {
      throw new ValidationError('titulo y cuerpo son requeridos');
    }
    await next();
  };
};
