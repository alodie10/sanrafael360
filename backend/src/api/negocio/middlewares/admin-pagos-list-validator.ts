import { ValidationError } from '../../../utils/errors';

const FILTER_TYPES = new Set(['all', 'premium', 'expired', 'expiring']);
const MONTH_RE = /^\d{4}-\d{2}$/;

function asString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '');
  return typeof value === 'string' ? value : '';
}

export default (_config: unknown, _ctx: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const query = ctx.query || {};
    const filterType = asString(query.filterType);
    const month = asString(query.month);
    const search = asString(query.search);

    if (filterType && !FILTER_TYPES.has(filterType)) {
      throw new ValidationError('filterType inválido');
    }
    if (month && !MONTH_RE.test(month)) {
      throw new ValidationError('month debe ser YYYY-MM');
    }
    if (search.length > 120) {
      throw new ValidationError('search es demasiado largo');
    }

    ctx.query = { ...query, filterType, month, search };
    await next();
  };
};
