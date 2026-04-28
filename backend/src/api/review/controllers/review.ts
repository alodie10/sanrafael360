import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review' as any, ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    try {
      const { data } = (ctx.request.body as any);
      
      strapi.log.info(`[Review-Direct] Iniciando creación manual para negocio: ${data.negocio}`);

      // 1. EL GUARDIA (Validación de Dueño)
      if (data.negocio) {
        const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
          documentId: data.negocio,
          populate: ['owner']
        });

        if (negocio) {
          const ownerId = (negocio.owner as any)?.documentId || (negocio.owner as any)?.id;
          const currentUserId = user.documentId || user.id;

          if (ownerId && String(ownerId) === String(currentUserId)) {
            return ctx.badRequest("No puedes dejar una reseña en tu propio negocio.");
          }
        }
      }

      // 2. CREACIÓN POR DOCUMENT SERVICE (By-pass de validación de llaves)
      // Usamos el Document Service directamente, que es más permisivo y potente
      const newReview = await strapi.documents('api::review.review' as any).create({
        data: {
          rating: Number(data.rating),
          comentario: data.comentario,
          negocio: data.negocio,
          autor: user.id // Forzamos el autor de la sesión
        },
        status: 'published' // La publicamos de una vez
      });

      strapi.log.info(`[Review-Direct] ✅ Reseña creada con éxito: ${newReview.documentId}`);

      return { data: newReview };

    } catch (err: any) {
      strapi.log.error(`[Review-Direct] ❌ FALLO CRÍTICO: ${err.message}`);
      // Si Strapi sigue diciendo "Invalid key autor", es un problema de DB serio
      return ctx.internalServerError(`Error de Strapi: ${err.message}`);
    }
  }
}));
