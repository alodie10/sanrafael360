const { algoliasearch } = require('algoliasearch');

async function cleanOrphans() {
  const APP_ID = process.env.ALGOLIA_APP_ID;
  const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
  const client = algoliasearch(APP_ID, ADMIN_KEY);

  console.log("Fetching published businesses from Prod API...");
  const res = await fetch('https://sanrafael360-production.up.railway.app/api/negocios?pagination[pageSize]=1000');
  const json = await res.json();
  const publishedIds = json.data.map(n => n.documentId);
  
  console.log(`Strapi has ${publishedIds.length} published businesses.`);
  
  console.log("Fetching Algolia records...");
  const searchRes = await client.search({
    requests: [
      {
        indexName: 'negocios',
        query: '',
        hitsPerPage: 1000,
      }
    ]
  });
  
  const algoliaHits = searchRes.results[0].hits;
  console.log(`Algolia has ${algoliaHits.length} businesses.`);
  
  let deleted = 0;
  for (const hit of algoliaHits) {
    if (!publishedIds.includes(hit.objectID)) {
      console.log(`Deleting ORPHAN from Algolia: ${hit.nombre} (${hit.objectID})`);
      await client.deleteObject({
        indexName: 'negocios',
        objectID: hit.objectID
      });
      deleted++;
    }
  }
  
  console.log(`Deleted ${deleted} orphaned businesses from Algolia.`);
}

cleanOrphans().catch(console.error);
