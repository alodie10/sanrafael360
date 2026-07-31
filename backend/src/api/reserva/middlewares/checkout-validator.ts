import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const required = ['slug', 'recursoDocumentId', 'inicio', 'cliente_nombre', 'cliente_email'];
    for (const key of required) {
      if (!body[key] || typeof body[key] !== 'string' || !String(body[key]).trim()) {
        throw new ValidationError(`${key} es requerido`);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.cliente_email).trim())) {
      throw new ValidationError('cliente_email inválido');
    }
    await next();
  };
};
