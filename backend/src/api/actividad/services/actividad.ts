import { factories } from '@strapi/strapi';
import { createActividadRepository } from '../repositories/actividad-repository';
import { resolveAdminUser, userHasAdminAccess } from '../../../utils/admin-access';
import { UnauthorizedError } from '../../../utils/errors';

export default factories.createCoreService('api::actividad.actividad' as any, ({ strapi }) => ({
  async listForAuthenticatedUser(
    user: { id: number; email?: string; role?: { name?: string } },
    query: { pagination?: { limit?: string }; sort?: string }
  ) {
    const fullUser = await resolveAdminUser(strapi, user);
    if (!fullUser) throw new UnauthorizedError();

    const isAdmin = userHasAdminAccess(fullUser);
    const filters: Record<string, unknown> = {};

    if (!isAdmin) {
      filters.usuario = { id: { $eq: user.id } };
    }

    const limitRaw = parseInt(query.pagination?.limit ?? '50', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 50;
    const repo = createActividadRepository(strapi);
    const results = await repo.findMany({
      filters,
      sort: query.sort,
      limit,
      includeUser: isAdmin,
    });

    return {
      data: results,
      meta: { pagination: { total: results.length } },
    };
  },
}));
