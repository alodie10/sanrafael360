import { AppError } from '../utils/errors';

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    try {
      await next();
    } catch (err: any) {
      // Dejar que Strapi maneje los errores del panel de administración
      if (!ctx.request.url.startsWith('/api/')) {
        throw err;
      }

      const statusCode = err.statusCode || err.status || 500;
      const isProduction = process.env.NODE_ENV === 'production';

      // Loguear error internamente
      strapi.log.error({
        message: err.message,
        stack: err.stack,
        code: err.code,
        path: ctx.path,
        method: ctx.method,
      });

      // Respuesta estandarizada para la API pública
      ctx.status = statusCode;
      ctx.body = {
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.isOperational || !isProduction ? err.message : 'Error interno del servidor',
          ...((!isProduction && err.stack) && { stack: err.stack }),
        },
      };
    }
  };
};
