const { algoliasearch } = require('algoliasearch');

(async () => {
  const APP_ID = process.env.ALGOLIA_APP_ID;
  const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
  const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || 'negocios';

  if (!APP_ID || !ADMIN_KEY) {
    console.log("Faltan variables de entorno de Algolia.");
    return;
  }

  const client = algoliasearch(APP_ID, ADMIN_KEY);

  try {
    console.log("Configurando ranking e intención de búsqueda en Algolia...");

    await client.setSettings({
      indexName: INDEX_NAME,
      indexSettings: {
        searchableAttributes: ['nombre', 'categoria', 'search_keywords', 'atributos', 'descripcion'],
        attributesToHighlight: ['nombre', 'categoria', 'search_keywords', 'atributos', 'descripcion'],
        typoTolerance: true,
        disableTypoToleranceOnAttributes: ['descripcion'],
        minWordSizefor1Typo: 4,
        minWordSizefor2Typos: 12,
        exactOnSingleWordQuery: 'word',
        removeStopWords: ['es'],
        ignorePlurals: ['es'],
        removeWordsIfNoResults: 'firstWords',
        customRanking: ['desc(is_premium)'],
        indexLanguages: ['es'],
        queryLanguages: ['es'],
      }
    });

    console.log("¡Configuración de Algolia actualizada con éxito!");
  } catch (error) {
    console.error("Error configurando Algolia:", error);
  }
})();
