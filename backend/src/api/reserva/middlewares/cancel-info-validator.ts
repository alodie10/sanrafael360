import { ValidationError } from '../../../utils/errors';

/** Valida token en query para GET cancelar-info. */
export default (_config: unknown, _api: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const token = ctx.query?.token;
    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      throw new ValidationError('token requerido');
    }
    await next();
  };
};
