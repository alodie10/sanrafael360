export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    await next();
    ctx.set('Access-Control-Allow-Private-Network', 'true');
  };
};
