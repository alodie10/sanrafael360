const strapi = require('@strapi/strapi');
const { syncNegocioToAlgolia } = require('../src/api/negocio/services/algolia');

async function syncAll() {
  const app = await strapi().load();
  
  const negocios = await app.documents('api::negocio.negocio').findMany({
    pagination: { limit: 1000 }
  });
  
  console.log(`Found ${negocios.length} negocios. Syncing...`);
  
  for (const negocio of negocios) {
    await syncNegocioToAlgolia(negocio.documentId);
  }
  
  console.log('Sync complete!');
  process.exit(0);
}

syncAll().catch(err => {
  console.error(err);
  process.exit(1);
});
