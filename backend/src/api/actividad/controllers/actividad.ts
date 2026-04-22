import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::actividad.actividad' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    try {
      // NO usar ctx.query.filters para filtrar por plugin::users-permissions.user
      // porque Strapi v5 rechaza esa clave con "Invalid key usuario".
      // En su lugar, usamos el Document Service directamente.
      const { pagination, sort } = ctx.query as any;

      const results = await (strapi.documents as any)('api::actividad.actividad').findMany({
        filters: {
          usuario: { id: { $eq: user.id } }
        },
        populate: {
          negocio: { fields: ['nombre', 'slug'] },
        },
        sort: sort || 'createdAt:desc',
        limit: parseInt(pagination?.limit ?? '50', 10),
      });

      return ctx.send({
        data: results,
        meta: { pagination: { total: results.length } }
      });
    } catch (err: any) {
      strapi.log.error(`[ActividadController] Error en find: ${err.message}`);
      return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
    }
  },
}));
