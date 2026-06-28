const { algoliasearch } = require('algoliasearch');
const { createStrapi } = require('@strapi/strapi');
const { syncNegocioToAlgolia } = require('../src/api/negocio/services/algolia');

async function syncAll() {
  const APP_ID = process.env.ALGOLIA_APP_ID;
  const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
  const client = algoliasearch(APP_ID, ADMIN_KEY);

  console.log("Loading Strapi...");
  const app = createStrapi({ distDir: './dist' });
  await app.load();
  
  // 1. Fetch published negocios
  const negocios = await app.db.query('api::negocio.negocio').findMany({
    where: { publishedAt: { $notNull: true } },
    limit: 1000
  });
  
  console.log(`Found ${negocios.length} published negocios in Strapi.`);
  
  // 2. Clear Algolia Index
  console.log("Clearing Algolia Index...");
  await client.clearObjects({ indexName: 'negocios' });
  
  // 3. Re-sync all
  console.log("Re-syncing to Algolia...");
  for (const negocio of negocios) {
    // We use Strapi document service inside the algolia file, which expects global.strapi
    await syncNegocioToAlgolia(negocio.documentId);
  }
  
  console.log('Safe Sync complete!');
  process.exit(0);
}

syncAll().catch(err => {
  console.error(err);
  process.exit(1);
});
