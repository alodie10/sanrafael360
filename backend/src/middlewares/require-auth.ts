import { UnauthorizedError } from '../utils/errors';

/**
 * Exige JWT de Users-Permissions. Usar con `auth: false` para no depender
 * de grants del core router en rutas custom.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (ctx.state.user) {
      await next();
      return;
    }

    const header = ctx.request?.header?.authorization || ctx.request?.headers?.authorization || '';
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7).trim()
        : null;
    if (!token) throw new UnauthorizedError('Debes iniciar sesión');

    try {
      const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
      if (!payload?.id) throw new UnauthorizedError('Debes iniciar sesión');

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: payload.id },
        populate: ['role'],
      });
      if (!user) throw new UnauthorizedError('Debes iniciar sesión');
      ctx.state.user = user;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Debes iniciar sesión');
    }

    await next();
  };
};
