import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { resolveAdminUser, userHasAdminAccess } from '../utils/admin-access';

/**
 * Middleware: exige JWT de usuario autenticado con rol admin.
 * Usar en rutas /negocios/admin/* y operaciones privilegiadas.
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const user = ctx.state.user;
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
