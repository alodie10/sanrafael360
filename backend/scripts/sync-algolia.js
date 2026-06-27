const { syncNegocioToAlgolia } = require('../src/api/negocio/services/algolia');

(async () => {
  console.log(`\n====================================`);
  console.log(`Sincronizando negocios publicados con Algolia...`);
  
  // Obtenemos solo los publicados
  const negocios = await strapi.documents('api::negocio.negocio').findMany({
    status: 'published',
    pagination: { limit: 2000 }
  });
  
  for (const neg of negocios) {
    try {
      await syncNegocioToAlgolia(neg.documentId);
    } catch(e) {
      console.log(`Error sincronizando ${neg.nombre}: ${e.message}`);
    }
  }
  
  console.log(`¡Sincronización masiva con Algolia completada!`);
  console.log(`====================================\n`);
})();
