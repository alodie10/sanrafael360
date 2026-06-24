import { algoliasearch } from 'algoliasearch';

const APP_ID = process.env.ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';

const client = (APP_ID && ADMIN_KEY) ? algoliasearch(APP_ID, ADMIN_KEY) : null;
const INDEX_NAME = 'negocios';

export const syncNegocioToAlgolia = async (documentId: string) => {
  if (!client) {
    console.warn('Algolia keys missing, skipping sync');
    return;
  }

  try {
    // Fetch complete negocio data with relations
    const negocioData: any = await strapi.documents('api::negocio.negocio').findOne({
      documentId,
      populate: ['categoria', 'atributos']
    });

    if (!negocioData) {
       console.warn(`[Algolia] Negocio with ID ${documentId} not found.`);
       return;
    }

    let isPremiumActive = false;
    if (negocioData.is_premium) {
      if (!negocioData.premium_valid_until) {
        isPremiumActive = true;
      } else {
        isPremiumActive = new Date(negocioData.premium_valid_until) > new Date();
      }
    }

    const algoliaObject = {
      objectID: negocioData.documentId,
      nombre: negocioData.nombre,
      slug: negocioData.slug,
      descripcion: negocioData.descripcion,
      direccion: negocioData.direccion,
      latitud: negocioData.latitud,
      longitud: negocioData.longitud,
      is_premium: isPremiumActive,
      premium_valid_until: negocioData.premium_valid_until || null,
      categoria: negocioData.categoria?.nombre || null,
      atributos: negocioData.atributos?.map((attr: any) => attr.nombre) || [],
      atributos_ui: negocioData.atributos?.map((attr: any) => ({ nombre: attr.nombre })) || [],
      price_range: negocioData.price_range,
      rating: negocioData.rating || 0,
      review_count: negocioData.review_count || 0,
      google_rating: negocioData.google_rating || 0,
      google_review_count: negocioData.google_review_count || 0,
      tripadvisor_rating: negocioData.tripadvisor_rating || 0,
      tripadvisor_review_count: negocioData.tripadvisor_review_count || 0,
      imagen_portada: negocioData.imagen_portada?.url ? { url: negocioData.imagen_portada.url } : null,
      logo: negocioData.logo?.url ? { url: negocioData.logo.url } : null,
      owner: negocioData.owner ? { documentId: negocioData.owner.documentId || negocioData.owner.id } : null,
      _geoloc: negocioData.latitud && negocioData.longitud ? {
        lat: negocioData.latitud,
        lng: negocioData.longitud
      } : undefined,
    };

    await client.saveObject({
      indexName: INDEX_NAME,
      body: algoliaObject
    });
    console.log(`[Algolia] Synced negocio: ${negocioData.nombre}`);
  } catch (error) {
    console.error(`[Algolia] Error syncing negocio ${documentId}:`, error);
  }
};

export const deleteNegocioFromAlgolia = async (documentId: string) => {
  if (!client) return;
  try {
    await client.deleteObject({
      indexName: INDEX_NAME,
      objectID: documentId,
    });
    console.log(`[Algolia] Deleted negocio ID: ${documentId}`);
  } catch (error) {
    console.error(`[Algolia] Error deleting negocio ID ${documentId}:`, error);
  }
};
