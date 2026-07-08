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

    const limit = parseInt(query.pagination?.limit ?? '50', 10);
    const repo = createActividadRepository(strapi);
    const results = await repo.findMany({
      filters,
      sort: query.sort,
      limit,
    });

    return {
      data: results,
      meta: { pagination: { total: results.length } },
    };
  },
}));
