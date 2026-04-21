import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::actividad.actividad' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    
    // Si el usuario está autenticado, forzamos el filtro por su ID
    // Usamos la sintaxis de Strapi v5 para filtrar por relación
    if (user) {
      ctx.query.filters = {
        ...(ctx.query.filters as any || {}),
        usuario: {
          id: {
            $eq: user.id
          }
        }
      };
    }
    
    try {
      return await super.find(ctx);
    } catch (err: any) {
      strapi.log.error(`[ActividadController] Error en find: ${err.message}`);
      ctx.throw(500, err.message);
    }
  },
}));
