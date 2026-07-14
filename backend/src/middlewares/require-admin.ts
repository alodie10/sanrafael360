import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { resolveAdminUser, userHasAdminAccess } from '../utils/admin-access';

async function resolveRequestUser(strapi: any, ctx: any) {
  if (ctx.state.user) return ctx.state.user;

  const header = ctx.request?.header?.authorization || ctx.request?.headers?.authorization || '';
  const token = typeof header === 'string' && header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : null;
  if (!token) return null;

  try {
    const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
    if (!payload?.id) return null;

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: payload.id },
      populate: ['role'],
    });
    if (user) {
      ctx.state.user = user;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Middleware: exige JWT de usuario autenticado con privilegio admin.
 * Compatible con rutas `auth: false` (resuelve Bearer JWT a mano) para
 * evitar 403 de Users & Permissions en acciones custom nuevas.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const user = await resolveRequestUser(strapi, ctx);
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión');
    }

    const fullUser = await resolveAdminUser(strapi, user);
    if (!userHasAdminAccess(fullUser)) {
      throw new ForbiddenError('Acceso restringido a administradores');
    }

    ctx.state.adminUser = fullUser;
    await next();
  };
};
