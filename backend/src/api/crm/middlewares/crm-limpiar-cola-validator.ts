import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const slug = ctx.request.body?.slug;
    if (slug != null && (typeof slug !== 'string' || !slug.trim())) {
      throw new ValidationError('slug inválido');
    }
    await next();
  };
};
