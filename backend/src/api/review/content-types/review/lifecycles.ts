export default {
  async afterCreate(event: any) {
    const { result, params } = event;
    const { data } = params;

    if (data.negocio) {
      await updateNegocioRating(data.negocio);
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;
    const { data } = params;

    if (data.negocio) {
      await updateNegocioRating(data.negocio);
    }
  },

  async afterDelete(event: any) {
    const { result, params } = event;
    // En delete, el negocio está en el result
    if (result.negocio) {
      await updateNegocioRating(result.negocio.id || result.negocio.documentId);
    }
  }
};

async function updateNegocioRating(negocioId: string | number) {
  // 1. Traer todas las reseñas de este negocio
  const reviews = await strapi.documents('api::review.review' as any).findMany({
    filters: { negocio: negocioId },
    fields: ['rating']
  });

  const count = reviews.length;
  const sum = reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
  const average = count > 0 ? (sum / count).toFixed(1) : 0;

  // 2. Actualizar el negocio con el nuevo promedio y contador
  // Usamos el documentId o ID según corresponda
  await strapi.documents('api::negocio.negocio' as any).update({
    documentId: typeof negocioId === 'string' ? negocioId : undefined,
    id: typeof negocioId === 'number' ? negocioId : undefined,
    data: {
      rating: parseFloat(average as string),
      review_count: count
    } as any,
    status: 'published'
  });

  strapi.log.info(`⭐ Rating actualizado para Negocio [${negocioId}]: ${average} estrellas (${count} reseñas)`);
}
