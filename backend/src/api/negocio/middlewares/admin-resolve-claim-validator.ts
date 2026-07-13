import { ValidationError } from '../../../utils/errors';

const allowedDecisions = new Set(['approved', 'rejected']);

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const { decision } = ctx.request.body || {};
    if (!decision || !allowedDecisions.has(String(decision))) {
      throw new ValidationError('decision debe ser "approved" o "rejected"');
    }
    await next();
  };
};
