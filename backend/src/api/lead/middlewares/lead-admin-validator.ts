import { ValidationError } from '../../../utils/errors';

const ESTADOS = new Set(['nuevo', 'contactado', 'descartado', 'convertido']);

export default (_config: unknown, _opts: { strapi: unknown }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const estado = body.data?.estado ?? body.estado;
    if (!estado || !ESTADOS.has(String(estado))) {
      throw new ValidationError('Estado de lead inválido');
    }
    await next();
  };
};
