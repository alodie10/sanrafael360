export default {
  async afterCreate(event: any) {
    const { result } = event;
    strapi.log.info(`[ReviewLifecycle] afterCreate - ID: ${result.id}`);
    
    // En Strapi 5, la relación suele venir en el result
    const negocio = result.negocio;
    if (negocio) {
      const nId = negocio.documentId || negocio.id || negocio;
      await updateNegocioRating(nId).catch(err => strapi.log.error(`[ReviewLifecycle] Error: ${err.message}`));
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;
    strapi.log.info(`[ReviewLifecycle] afterUpdate - ID: ${result.id}`);
    
    const negocio = result.negocio;
    if (negocio) {
      const nId = negocio.documentId || negocio.id || negocio;
      await updateNegocioRating(nId).catch(err => strapi.log.error(`[ReviewLifecycle] Error: ${err.message}`));
    }
  },

  async afterDelete(event: any) {
    const { result } = event;
    strapi.log.info(`[ReviewLifecycle] afterDelete`);
    
    const negocio = result.negocio;
    if (negocio) {
      const nId = negocio.documentId || negocio.id || negocio;
      await updateNegocioRating(nId).catch(err => strapi.log.error(`[ReviewLifecycle] Error: ${err.message}`));
    }
  }
};

async function updateNegocioRating(negocioId: string | number) {
  strapi.log.info(`⭐ Recalculando Rating para Negocio: ${negocioId}`);

  // 1. Traer todas las reseñas de este negocio
  // Usamos el filtro de relación correcto para Strapi 5
  const reviews = await strapi.documents('api::review.review' as any).findMany({
    filters: { 
      negocio: {
        $or: [
          { id: typeof negocioId === 'number' ? negocioId : undefined },
          { documentId: typeof negocioId === 'string' ? negocioId : undefined }
        ].filter(Boolean)
      }
    },
    fields: ['rating']
  });

  const count = reviews.length;
  const sum = reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
  const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

  strapi.log.info(`   > Encontradas ${count} reseñas. Promedio: ${average}`);

  // 2. Actualizar el negocio
  await strapi.documents('api::negocio.negocio' as any).update({
    documentId: typeof negocioId === 'string' ? negocioId : undefined,
    id: typeof negocioId === 'number' ? negocioId : undefined,
    data: {
      rating: average,
      review_count: count
    } as any,
    status: 'published'
  });

  strapi.log.info(`✅ Negocio actualizado con éxito.`);
}
