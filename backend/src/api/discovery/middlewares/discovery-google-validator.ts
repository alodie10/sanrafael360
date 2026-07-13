import { ValidationError } from '../../../utils/errors';

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const name = ctx.request.body?.name;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Business name is required');
    }

    await next();
  };
};
