import { ValidationError } from '../../../utils/errors';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    if (body.paused !== undefined && typeof body.paused !== 'boolean') {
      throw new ValidationError('paused debe ser boolean');
    }
    await next();
  };
};
