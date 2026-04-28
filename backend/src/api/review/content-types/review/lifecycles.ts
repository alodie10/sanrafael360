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
    if (result.negocio) {
      const nId = result.negocio.documentId || result.negocio.id;
      await updateNegocioRating(nId);
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
      // REGLA KI: Siempre extraer el documentId para el Document Service
      const docId = review.negocio.documentId;
      if (docId) {
        await updateNegocioRating(docId);
      } else {
        strapi.log.warn(`[ReviewSync] Negocio sin documentId encontrado para reseña ${reviewId}`);
      }
    }
  } catch (err: any) {
    strapi.log.error(`[ReviewSync] Error: ${err.message}`);
  }
}

async function updateNegocioRating(docId: string) {
  strapi.log.info(`⭐ Recalculando Rating para Negocio (DocID): ${docId}`);

  const reviews = await strapi.documents('api::review.review' as any).findMany({
    filters: { negocio: { documentId: docId } },
    fields: ['rating'],
    limit: -1
  });

  const count = reviews.length;
  const sum = reviews.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
  const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

  strapi.log.info(`   > Encontradas ${count} reseñas. Promedio: ${average}`);

  // REGLA KI: Usar exclusivamente documentId para update en Strapi 5
  await strapi.documents('api::negocio.negocio' as any).update({
    documentId: docId,
    data: {
      rating: average,
      review_count: count
    } as any,
    status: 'published'
  });

  strapi.log.info(`✅ Negocio [${docId}] actualizado con éxito.`);
}
