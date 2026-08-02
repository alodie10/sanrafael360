import { ForbiddenError, UnauthorizedError } from '../../../utils/errors';
import { resolveAdminUser, userHasAdminAccess } from '../../../utils/admin-access';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';

async function resolveRequestUser(strapi: any, ctx: any) {
  if (ctx.state.user) return ctx.state.user;

  const header = ctx.request?.header?.authorization || ctx.request?.headers?.authorization || '';
  const token =
    typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;

  try {
    const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
    if (!payload?.id) return null;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: payload.id },
      populate: ['role'],
    });
    if (user) ctx.state.user = user;
    return user;
  } catch {
    return null;
  }
}

/**
 * Admin soberano O dueño del negocio vinculado al reserva-comercio (:slug).
 */
export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const user = await resolveRequestUser(strapi, ctx);
    if (!user) throw new UnauthorizedError('Debes iniciar sesión');

    const fullUser = await resolveAdminUser(strapi, user);
    if (userHasAdminAccess(fullUser)) {
      ctx.state.adminUser = fullUser;
      ctx.state.reservaAccess = { role: 'admin' };
      await next();
      return;
    }

    const slug = ctx.params?.slug;
    if (!slug) {
      throw new ForbiddenError('Acceso restringido a administradores');
    }

    const repo = createReservaComercioRepository(strapi);
    const comercio = await repo.findBySlug(String(slug), {
      negocio: { populate: ['owner'] },
    });
    const ownerId = comercio?.negocio?.owner?.id;
    if (!comercio || ownerId !== user.id) {
      throw new ForbiddenError('No tenés acceso a este módulo de reservas');
    }

    ctx.state.reservaAccess = { role: 'owner', comercioDocumentId: comercio.documentId };
    await next();
  };
};
