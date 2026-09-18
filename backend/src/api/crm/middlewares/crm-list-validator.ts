import { parseCrmListQuery } from '../crm-estado';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    ctx.state.crmListQuery = parseCrmListQuery(ctx.query || {});
    await next();
  };
};
