import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const method = ctx.request.method;

    if (method === 'POST') {
      if (!body.email || typeof body.email !== 'string') {
        throw new ValidationError('email es requerido');
      }
      if (!body.nombre || typeof body.nombre !== 'string') {
        throw new ValidationError('nombre es requerido');
      }
    }

    if (method === 'PUT') {
      if (body.email !== undefined && typeof body.email !== 'string') {
        throw new ValidationError('email inválido');
      }
      if (body.nombre !== undefined && typeof body.nombre !== 'string') {
        throw new ValidationError('nombre inválido');
      }
    }

    await next();
  };
};
