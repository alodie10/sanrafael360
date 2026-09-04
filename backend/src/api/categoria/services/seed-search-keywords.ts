import { buildSearchKeywords, parseKeywordList } from '../../negocio/services/search-keywords';
import {
  pauseCategoriaReindex,
  reindexAllPublishedNegocios,
  resumeCategoriaReindex,
} from '../../negocio/services/algolia';

function needsSeed(palabrasClave?: string | null): boolean {
  return parseKeywordList(palabrasClave).length === 0;
}

export async function seedCategoriaSearchKeywords(strapi: any): Promise<number> {
  const categorias = await strapi.documents('api::categoria.categoria').findMany({
    fields: ['documentId', 'nombre', 'slug', 'palabras_clave'],
    populate: { parent: { fields: ['nombre', 'slug', 'palabras_clave'] } },
    pagination: { limit: 200 },
    status: 'published',
  });

  pauseCategoriaReindex();
  let updated = 0;
  try {
    for (const categoria of categorias || []) {
      if (!categoria.documentId || !needsSeed(categoria.palabras_clave)) continue;
      const terms = buildSearchKeywords(categoria);
      if (terms.length === 0) continue;
      await strapi.documents('api::categoria.categoria').update({
        documentId: categoria.documentId,
        data: { palabras_clave: terms.join(', ') },
        status: 'published',
      });
      updated += 1;
    }
  } finally {
    resumeCategoriaReindex();
  }

  if (updated > 0) {
    reindexAllPublishedNegocios().catch((err) => {
      console.error('[Algolia] Background reindex after keyword seed failed:', err);
    });
  }
  return updated;
}
