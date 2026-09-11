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

    if (body.tipo !== undefined && body.tipo !== 'efemeride' && body.tipo !== 'feria') {
      throw new ValidationError('tipo debe ser efemeride o feria');
    }

    if (body.participantes_externos !== undefined && !Array.isArray(body.participantes_externos)) {
      throw new ValidationError('participantes_externos debe ser un array');
    }

    if (ctx.request.method === 'POST' && !String(body.nombre || '').trim()) {
      throw new ValidationError('nombre es obligatorio');
    }

    if (body.nombre !== undefined && !String(body.nombre).trim()) {
      throw new ValidationError('nombre es obligatorio');
    }

    if (body.publicado !== undefined && typeof body.publicado !== 'boolean') {
      throw new ValidationError('publicado debe ser true o false');
    }

    await next();
  };
};
