import { ValidationError } from '../../../utils/errors';

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body.data || ctx.request.body;

    if (!body.email || !body.email.includes('@')) {
      throw new ValidationError('Debes proporcionar un email válido.');
    }

    if (!body.mensaje || body.mensaje.length < 5) {
      throw new ValidationError('El mensaje debe tener al menos 5 caracteres.');
    }

    await next();
  };
};
