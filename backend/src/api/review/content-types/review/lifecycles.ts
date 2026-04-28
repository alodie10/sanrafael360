export default {
  async afterCreate(event: any) {
    const { result } = event;
    // Sincronización de Rating en segundo plano
    syncRating(result.id).catch(err => strapi.log.error(`[ReviewSync] Error: ${err.message}`));
  },

  async afterUpdate(event: any) {
    const { result } = event;
    syncRating(result.id).catch(err => strapi.log.error(`[ReviewSync] Error: ${err.message}`));
  },

  async afterDelete(event: any) {
    const { result } = event;
    if (result.negocio) {
      const nId = result.negocio.documentId || result.negocio.id;
      updateNegocioRating(nId).catch(err => strapi.log.error(`[ReviewSync] Error: ${err.message}`));
    }
  }
};

async function syncRating(reviewId: any) {
  const review = await strapi.documents('api::review.review' as any).findOne({
    documentId: typeof reviewId === 'string' ? reviewId : undefined,
    id: typeof reviewId === 'number' ? reviewId : undefined,
    populate: ['negocio']
  });

  if (review?.negocio) {
    const nId = review.negocio.documentId || review.negocio.id;
    await updateNegocioRating(nId);
  }
}

async function updateNegocioRating(negocioId: string | number) {
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
}
