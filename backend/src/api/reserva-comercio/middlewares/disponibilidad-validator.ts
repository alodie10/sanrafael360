import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { slug } = ctx.params;
    if (!slug || typeof slug !== 'string') {
      throw new ValidationError('slug es requerido');
    }

    const fecha = ctx.query?.fecha;
    if (fecha !== undefined && fecha !== null && fecha !== '') {
      if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw new ValidationError('fecha debe ser YYYY-MM-DD');
      }
    }

    const diasRaw = ctx.query?.dias;
    if (diasRaw !== undefined && diasRaw !== null && diasRaw !== '') {
      const dias = Number(diasRaw);
      if (!Number.isFinite(dias) || dias < 1 || dias > 14) {
        throw new ValidationError('dias debe ser un entero entre 1 y 14');
      }
    }

    await next();
  };
};
