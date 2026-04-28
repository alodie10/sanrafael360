
export default async ({ strapi }) => {
  strapi.log.info('🚀 Iniciando limpieza de ratings y contadores...');

  try {
    const negocios = await strapi.documents('api::negocio.negocio' as any).findMany({
      fields: ['id', 'documentId', 'nombre'],
      limit: -1
    });

    strapi.log.info(`Encontrados ${negocios.length} negocios para resetear.`);

    for (const negocio of negocios) {
      await strapi.documents('api::negocio.negocio' as any).update({
        documentId: negocio.documentId,
        data: {
          rating: 0,
          review_count: 0
        } as any,
        status: 'published'
      });
    }

    strapi.log.info('✅ Limpieza completada exitosamente. Todos los negocios están en 0.');
  } catch (err) {
    strapi.log.error(`❌ Error durante la limpieza: ${err.message}`);
  }
};
