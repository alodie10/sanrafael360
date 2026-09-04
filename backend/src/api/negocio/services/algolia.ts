import { algoliasearch } from 'algoliasearch';
import { ALGOLIA_INDEX_SETTINGS } from './algolia-index-settings';
import { buildSearchKeywords } from './search-keywords';

const APP_ID = process.env.ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';

const client = (APP_ID && ADMIN_KEY) ? algoliasearch(APP_ID, ADMIN_KEY) : null;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || (process.env.NODE_ENV === 'production' ? 'negocios' : 'negocios_dev');

let settingsApplied = false;

const NEGOCIO_ALGOLIA_POPULATE = {
  categoria: { populate: { parent: true } },
  atributos: true,
  imagen_portada: true,
  logo: true,
  owner: true,
  ofertas: {
    filters: { publishedAt: { $notNull: true } },
  },
};

export async function applyAlgoliaIndexSettings() {
  if (!client || settingsApplied) return;
  try {
    await client.setSettings({
      indexName: INDEX_NAME,
      indexSettings: ALGOLIA_INDEX_SETTINGS,
    });
    settingsApplied = true;
    console.log(`[Algolia] Index settings applied on ${INDEX_NAME}`);
  } catch (error) {
    console.error('[Algolia] Error applying index settings:', error);
  }
}

function isPremiumActive(negocioData: { is_premium?: boolean; premium_valid_until?: string | null }): boolean {
  if (!negocioData.is_premium) return false;
  if (!negocioData.premium_valid_until) return true;
  return new Date(negocioData.premium_valid_until) > new Date();
}

function mediaUrl(media: { url?: string } | null | undefined) {
  return media?.url ? { url: media.url } : null;
}

function buildAlgoliaObject(negocioData: any) {
  const premium = isPremiumActive(negocioData);
  return {
    objectID: negocioData.documentId,
    nombre: negocioData.nombre,
    slug: negocioData.slug,
    descripcion: negocioData.descripcion,
    direccion: negocioData.direccion,
    latitud: negocioData.latitud,
    longitud: negocioData.longitud,
    is_premium: premium,
    premium_valid_until: negocioData.premium_valid_until || null,
    categoria: negocioData.categoria?.nombre || null,
    search_keywords: buildSearchKeywords(negocioData.categoria),
    atributos: negocioData.atributos?.map((attr: any) => attr.nombre) || [],
    atributos_ui: negocioData.atributos?.map((attr: any) => ({ nombre: attr.nombre })) || [],
    price_range: negocioData.price_range,
    rating: negocioData.rating || 0,
    review_count: negocioData.review_count || 0,
    google_rating: negocioData.google_rating || 0,
    google_review_count: negocioData.google_review_count || 0,
    tripadvisor_rating: negocioData.tripadvisor_rating || 0,
    tripadvisor_review_count: negocioData.tripadvisor_review_count || 0,
    imagen_portada: mediaUrl(negocioData.imagen_portada),
    logo: mediaUrl(negocioData.logo),
    owner: negocioData.owner ? { documentId: negocioData.owner.documentId || negocioData.owner.id } : null,
    ofertas: negocioData.ofertas
      ?.filter((o: any) => o.activa)
      .map((o: any) => ({
        documentId: o.documentId,
        titulo: o.titulo,
        tipo_oferta: o.tipo_oferta,
        porcentaje_descuento: o.porcentaje_descuento,
        valida_hasta: o.valida_hasta,
        valida_desde: o.valida_desde,
        activa: o.activa,
      })) || [],
    reserva_url: negocioData.reserva_url || null,
    reserva_habilitada: negocioData.reserva_habilitada !== false,
    cta_link: negocioData.cta_link || null,
    cta_habilitado: Boolean(negocioData.cta_habilitado),
    _geoloc: negocioData.latitud && negocioData.longitud ? {
      lat: negocioData.latitud,
      lng: negocioData.longitud,
    } : undefined,
  };
}

export const syncNegocioToAlgolia = async (documentId: string) => {
  if (!client) {
    console.warn('Algolia keys missing, skipping sync');
    return;
  }

  try {
    await applyAlgoliaIndexSettings();
    const negocioData: any = await strapi.documents('api::negocio.negocio').findOne({
      documentId,
      status: 'published',
      populate: NEGOCIO_ALGOLIA_POPULATE,
    });

    if (!negocioData) {
      console.log(`[Algolia] Negocio with ID ${documentId} not found or not published. Deleting from Algolia.`);
      await client.deleteObject({
        indexName: INDEX_NAME,
        objectID: documentId,
      });
      return;
    }

    await client.saveObject({
      indexName: INDEX_NAME,
      body: buildAlgoliaObject(negocioData),
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

export async function reindexNegociosForCategoria(categoriaDocumentId: string) {
  if (categoriaReindexPaused) return;
  const negocios = await strapi.documents('api::negocio.negocio').findMany({
    filters: { categoria: { documentId: { $eq: categoriaDocumentId } } },
    fields: ['documentId'],
    status: 'published',
    pagination: { limit: 1000 },
  });
  for (const negocio of negocios || []) {
    if (negocio.documentId) await syncNegocioToAlgolia(negocio.documentId);
  }
}

export async function reindexAllPublishedNegocios() {
  const negocios = await strapi.documents('api::negocio.negocio').findMany({
    fields: ['documentId'],
    status: 'published',
    pagination: { limit: 1000 },
  });
  for (const negocio of negocios || []) {
    if (negocio.documentId) await syncNegocioToAlgolia(negocio.documentId);
  }
}

let categoriaReindexPaused = false;

export function pauseCategoriaReindex() {
  categoriaReindexPaused = true;
}

export function resumeCategoriaReindex() {
  categoriaReindexPaused = false;
}
