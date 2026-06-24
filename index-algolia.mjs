import { algoliasearch } from 'algoliasearch';

const APP_ID = '056RFI6FWN';
const ADMIN_KEY = '020ce4c35280e203236a0dabc4de37b7';
const STRAPI_URL = 'https://sanrafael360-production.up.railway.app';
const INDEX_NAME = 'negocios';

async function main() {
  console.log('Initializing Algolia client...');
  const client = algoliasearch(APP_ID, ADMIN_KEY);

  console.log('Fetching all negocios from production Strapi...');
  const res = await fetch(`${STRAPI_URL}/api/negocios?pagination[pageSize]=1000&populate=*`);
  const json = await res.json();
  const negocios = json.data;

  console.log(`Found ${negocios.length} negocios. Formatting for Algolia...`);

  const objectsToSync = negocios.map((negocioData) => {
    let isPremiumActive = false;
    if (negocioData.is_premium) {
      if (!negocioData.premium_valid_until) {
        isPremiumActive = true;
      } else {
        isPremiumActive = new Date(negocioData.premium_valid_until) > new Date();
      }
    }

    return {
      objectID: negocioData.documentId,
      nombre: negocioData.nombre,
      slug: negocioData.slug,
      descripcion: negocioData.descripcion,
      direccion: negocioData.direccion,
      latitud: negocioData.latitud,
      longitud: negocioData.longitud,
      is_premium: isPremiumActive,
      categoria: negocioData.categoria?.nombre || null,
      atributos: negocioData.atributos?.map((attr) => attr.nombre) || [],
      price_range: negocioData.price_range,
      rating: negocioData.rating || 0,
      _geoloc: negocioData.latitud && negocioData.longitud ? {
        lat: negocioData.latitud,
        lng: negocioData.longitud
      } : undefined,
    };
  });

  console.log(`Uploading ${objectsToSync.length} objects to Algolia...`);
  
  // Splitting into chunks of 100 to avoid payload size limits if any
  const chunkSize = 100;
  for (let i = 0; i < objectsToSync.length; i += chunkSize) {
    const chunk = objectsToSync.slice(i, i + chunkSize);
    try {
        const responses = await Promise.all(chunk.map(obj => client.saveObject({
            indexName: INDEX_NAME,
            body: obj
        })));
        console.log(`Uploaded chunk ${i / chunkSize + 1} (${chunk.length} items)`);
    } catch (e) {
        console.error('Error uploading chunk:', e);
    }
  }

  console.log('Done! Algolia index is populated.');
}

main().catch(console.error);
