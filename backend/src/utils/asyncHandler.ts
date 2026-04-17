// Strapi 5 usa Koa por debajo, no Express estándar.
export const asyncHandler = (fn: (ctx: any) => Promise<any>) => {
  return async (ctx: any, next: () => Promise<void>) => {
    try {
      await fn(ctx);
    } catch (err) {
      // Lanzamos el error para que sea capturado por el middleware global errorHandler
      throw err;
    }
  };
};
