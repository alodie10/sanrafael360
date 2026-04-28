export default {
  async afterCreate(event: any) {
    const { result } = event;
    await syncRating(result.id);
  },

  async afterUpdate(event: any) {
    const { result } = event;
    await syncRating(result.id);
  },

  async afterDelete(event: any) {
    const { result } = event;
    // En delete, si ya conocemos el negocio, lo usamos
    if (result.negocio) {
      const nId = result.negocio.documentId || result.negocio.id;
      await updateNegocioRating(nId);
    }
  }
};

async function syncRating(reviewId: number | string) {
  try {
    // 1. Buscamos la reseña completa para estar 100% seguros de qué negocio es
    const review = await strapi.documents('api::review.review' as any).findOne({
      documentId: typeof reviewId === 'string' ? reviewId : undefined,
      id: typeof reviewId === 'number' ? reviewId : undefined,
      populate: ['negocio']
    });

    if (review?.negocio) {
      const nId = review.negocio.documentId || review.negocio.id;
      await updateNegocioRating(nId);
    }
  } catch (err: any) {
    strapi.log.error(`[ReviewSync] Error: ${err.message}`);
  }
}

async function updateNegocioRating(negocioId: string | number) {
  strapi.log.info(`⭐ Recalculando Rating para Negocio: ${negocioId}`);

  // 1. Traer todas las reseñas de este negocio (usando el formato más simple de Strapi 5)
  const reviews = await strapi.documents('api::review.review' as any).findMany({
    filters: { 
      negocio: {
        documentId: typeof negocioId === 'string' ? negocioId : undefined,
        id: typeof negocioId === 'number' ? negocioId : undefined
      }
    },
    fields: ['rating'],
    limit: -1 // REGLA KI: Siempre traer todos para cálculos de agregación
  });

  const count = reviews.length;
  const sum = reviews.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
  const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

  strapi.log.info(`   > Encontradas ${count} reseñas. Promedio: ${average}`);

  // 2. Actualizar el negocio con Document Service (preferido en Strapi 5)
  await strapi.documents('api::negocio.negocio' as any).update({
    documentId: typeof negocioId === 'string' ? negocioId : (negocioId as any).documentId,
    id: typeof negocioId === 'number' ? negocioId : undefined,
    data: {
      rating: average,
      review_count: count
    } as any,
    status: 'published'
  });

  strapi.log.info(`✅ Negocio actualizado con éxito.`);
}
