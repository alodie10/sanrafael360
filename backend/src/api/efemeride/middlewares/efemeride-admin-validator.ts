import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};

    if (body.vigente_hasta != null && body.vigente_hasta !== '') {
      if (Number.isNaN(Date.parse(String(body.vigente_hasta)))) {
        throw new ValidationError('vigente_hasta debe ser una fecha válida');
      }
    }

    if (body.vigente_desde != null && body.vigente_desde !== '') {
      if (Number.isNaN(Date.parse(String(body.vigente_desde)))) {
        throw new ValidationError('vigente_desde debe ser una fecha válida');
      }
    }

    if (body.negocioIds !== undefined && !Array.isArray(body.negocioIds)) {
      throw new ValidationError('negocioIds debe ser un array');
    }

    await next();
  };
};
