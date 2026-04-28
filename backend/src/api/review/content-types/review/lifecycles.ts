export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    
    if (data.negocio && data.usuario) {
      // Buscamos el negocio para ver quién es el dueño
      const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
        documentId: typeof data.negocio === 'string' ? data.negocio : undefined,
        id: typeof data.negocio === 'number' ? data.negocio : undefined,
        populate: ['owner']
      });

      const ownerId = negocio?.owner?.documentId || negocio?.owner?.id;
      const currentUserId = data.usuario.documentId || data.usuario.id || data.usuario;

      if (ownerId && String(ownerId) === String(currentUserId)) {
        throw new Error("No puedes dejar una reseña en tu propio negocio.");
      }
    }
  },

  async afterCreate(event: any) {
    const { result } = event;
    // Ejecutamos en segundo plano para no bloquear la respuesta de la API
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
    // Buscamos la reseña para obtener el negocio
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
    strapi.log.info(`⭐ Sincronizando Rating para: ${negocioId}`);

    // 1. Buscamos todas las reseñas
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

    // 2. Actualización forzada
    // Si es string usamos documentId, si es number usamos id
    await strapi.documents('api::negocio.negocio' as any).update({
      documentId: typeof negocioId === 'string' ? negocioId : undefined,
      id: typeof negocioId === 'number' ? negocioId : undefined,
      data: {
        rating: average,
        review_count: count
      } as any,
      status: 'published'
    });

    strapi.log.info(`✅ [${negocioId}] Sincronizado correctamente.`);
  } catch (err: any) {
    strapi.log.error(`[ReviewUpdate] Falló actualización de negocio: ${err.message}`);
    // NO lanzamos el error para evitar el 500 en el frontend
  }
}
