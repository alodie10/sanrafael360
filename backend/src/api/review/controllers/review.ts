import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review' as any, ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    try {
      const { data } = (ctx.request.body as any);
      
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

      // 2. CREACIÓN MANUAL
      const newReview = await strapi.documents('api::review.review' as any).create({
        data: {
          rating: Number(data.rating),
          comentario: data.comentario,
          negocio: data.negocio,
          autor: user.id
        },
        status: 'published'
      });

      // 3. RECALCULO FORZADO (Sincronización Inmediata)
      if (data.negocio) {
        strapi.log.info(`[Review-Sync] Forzando recalculo para negocio: ${data.negocio}`);
        
        // Obtenemos todas las reseñas de este negocio
        const allReviews = await strapi.documents('api::review.review' as any).findMany({
          filters: { negocio: { documentId: data.negocio } },
          fields: ['rating'],
          limit: -1
        });

        const count = allReviews.length;
        const sum = allReviews.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
        const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

        // Actualizamos el negocio con el nuevo promedio y contador
        await strapi.documents('api::negocio.negocio' as any).update({
          documentId: data.negocio,
          data: {
            rating: average,
            review_count: count
          } as any,
          status: 'published'
        });

        strapi.log.info(`[Review-Sync] ✅ Negocio actualizado: ${average} estrellas, ${count} reseñas.`);
      }

      return { data: newReview };

    } catch (err: any) {
      strapi.log.error(`[Review-Create] Error: ${err.message}`);
      return ctx.internalServerError(`Error: ${err.message}`);
    }
  }
}));
