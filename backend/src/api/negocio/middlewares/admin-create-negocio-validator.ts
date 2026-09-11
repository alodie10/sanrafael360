import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (!String(body.nombre || '').trim()) {
      throw new ValidationError('nombre es obligatorio');
    }
    if (!String(body.categoriaId || '').trim()) {
      throw new ValidationError('categoria es obligatoria');
    }
    await next();
  };
};
