import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::actividad.actividad' as any, ({ strapi }) => ({
  async find(ctx) {
    // Si el usuario está autenticado, forzamos el filtro por su ID
    if (ctx.state.user) {
      ctx.query.filters = {
        ...(ctx.query.filters as any || {}),
        usuario: ctx.state.user.id
      };
    }
    
    // Ejecutamos la lógica estándar de Strapi con el filtro inyectado
    return await super.find(ctx);
  },
}));
