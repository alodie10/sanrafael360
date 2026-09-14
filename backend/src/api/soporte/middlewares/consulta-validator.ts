import { ValidationError } from '../../../utils/errors';

export default (_config: any, { strapi: _strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body?.data || ctx.request.body || {};

    if (!body.asunto || String(body.asunto).trim().length < 3) {
      throw new ValidationError('El asunto debe tener al menos 3 caracteres.');
    }

    if (!body.mensaje || String(body.mensaje).length < 5) {
      throw new ValidationError('El mensaje debe tener al menos 5 caracteres.');
    }

    await next();
  };
};
