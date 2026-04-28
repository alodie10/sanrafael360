import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { data } = ctx.request.body;
    
    // 1. VALIDACIÓN DE SEGURIDAD (EL GUARDIA)
    try {
      if (data.negocio) {
        // Buscamos el negocio relacionado asegurando el POPULATE del owner
        const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
          documentId: data.negocio,
          populate: ['owner']
        });

        // REGLA: Si el dueño no existe o no se encuentra, dejamos pasar (Resiliencia)
        const ownerId = negocio?.owner?.documentId || negocio?.owner?.id;
        const currentUserId = user.documentId || user.id;

        if (ownerId && String(ownerId) === String(currentUserId)) {
          return ctx.badRequest("No puedes dejar una reseña en tu propio negocio.");
        }
      }
    } catch (err: any) {
      strapi.log.warn(`[Review-Security] Error validando dueño (Resiliencia activada): ${err.message}`);
      // En caso de error técnico, permitimos la creación para no bloquear al usuario
    }

    // 2. CREACIÓN ATÓMICA
    // Aseguramos que el autor sea el usuario de la sesión, ignorando lo que mande el cliente por seguridad
    data.autor = user.id; 

    const response = await super.create(ctx);
    return response;
  }
}));
