export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    
    try {
      if (data.negocio && data.user) {
        // Obtenemos el ID del negocio (puede venir de varias formas en Strapi 5)
        const nId = typeof data.negocio === 'object' ? (data.negocio.documentId || data.negocio.id) : data.negocio;
        const uId = typeof data.user === 'object' ? (data.user.documentId || data.user.id) : data.user;

        if (nId && uId) {
          const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
            documentId: typeof nId === 'string' ? nId : undefined,
            id: typeof nId === 'number' ? nId : undefined,
            populate: ['owner']
          });

          const ownerId = negocio?.owner?.documentId || negocio?.owner?.id;

          if (ownerId && String(ownerId) === String(uId)) {
            // Usamos un error genérico de Strapi para que no devuelva 500
            const { ApplicationError } = require('@strapi/utils').errors;
            throw new ApplicationError("No puedes dejar una reseña en tu propio negocio.");
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'ApplicationError') throw err;
      strapi.log.error(`[Review-BeforeCreate] Error silencioso: ${err.message}`);
      // Si el error no es de validación, dejamos pasar para evitar el 500
    }
  },

  async afterCreate(event: any) {
    const { result } = event;
    syncRating(result.id).catch(err => strapi.log.error(`[ReviewLifecycle] Fatal: ${err.message}`));
  },

  async afterUpdate(event: any) {
    const { result } = event;
    syncRating(result.id).catch(err => strapi.log.error(`[ReviewLifecycle] Fatal: ${err.message}`));
  },

  async afterDelete(event: any) {
    const { result } = event;
    if (result.negocio) {
      const nId = result.negocio.documentId || result.negocio.id;
      updateNegocioRating(nId).catch(err => strapi.log.error(`[ReviewLifecycle] Fatal: ${err.message}`));
    }
  }
};

async function syncRating(reviewId: number | string) {
  try {
    const review = await strapi.documents('api::review.review' as any).findOne({
      documentId: typeof reviewId === 'string' ? reviewId : undefined,
      id: typeof reviewId === 'number' ? reviewId : undefined,
      populate: ['negocio']
    });

    if (review?.negocio) {
      const docId = review.negocio.documentId || review.negocio.id;
      if (docId) {
        await updateNegocioRating(docId);
      }
    }
  } catch (err: any) {
    strapi.log.error(`[ReviewSync] Error interno: ${err.message}`);
  }
}

async function updateNegocioRating(negocioId: string | number) {
  try {
    const reviews = await strapi.documents('api::review.review' as any).findMany({
      filters: { 
        negocio: {
          $or: [
            { documentId: typeof negocioId === 'string' ? negocioId : undefined },
            { id: typeof negocioId === 'number' ? negocioId : undefined }
          ].filter(Boolean)
        }
      },
      fields: ['rating'],
      limit: -1
    });

    const count = reviews.length;
    const sum = reviews.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
    const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    await strapi.documents('api::negocio.negocio' as any).update({
      documentId: typeof negocioId === 'string' ? negocioId : undefined,
      id: typeof negocioId === 'number' ? negocioId : undefined,
      data: {
        rating: average,
        review_count: count
      } as any,
      status: 'published'
    });
  } catch (err: any) {
    strapi.log.error(`[ReviewUpdate] Falló actualización: ${err.message}`);
  }
}
