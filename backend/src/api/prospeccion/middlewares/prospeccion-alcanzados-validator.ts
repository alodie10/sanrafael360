import { ValidationError } from '../../../utils/errors';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const startDate = ctx.query?.startDate;
    const endDate = ctx.query?.endDate;

    if (startDate && (typeof startDate !== 'string' || !DATE_RE.test(startDate))) {
      throw new ValidationError('startDate debe ser YYYY-MM-DD');
    }
    if (endDate && (typeof endDate !== 'string' || !DATE_RE.test(endDate))) {
      throw new ValidationError('endDate debe ser YYYY-MM-DD');
    }

    await next();
  };
};
