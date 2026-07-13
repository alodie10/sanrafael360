import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { premium_valid_until } = ctx.request.body || {};
    if (premium_valid_until != null && Number.isNaN(Date.parse(String(premium_valid_until)))) {
      throw new ValidationError('premium_valid_until debe ser una fecha válida');
    }
    await next();
  };
};
