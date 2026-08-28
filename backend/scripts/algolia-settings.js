const { algoliasearch } = require('algoliasearch');

(async () => {
  const APP_ID = process.env.ALGOLIA_APP_ID;
  const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
  const INDEX_NAME = 'negocios';

  if (!APP_ID || !ADMIN_KEY) {
    console.log("Faltan variables de entorno de Algolia.");
    return;
  }

  const client = algoliasearch(APP_ID, ADMIN_KEY);

  try {
    console.log("Configurando ranking de Algolia para priorizar Premium...");
    
    await client.setSettings({
      indexName: INDEX_NAME,
      indexSettings: {
        searchableAttributes: ['nombre', 'atributos', 'descripcion'],
        typoTolerance: false,
        exactOnSingleWordQuery: 'word',
        customRanking: ['desc(is_premium)'],
        attributesToHighlight: ['nombre', 'atributos', 'descripcion'],
        indexLanguages: ['es'],
        queryLanguages: ['es'],
      }
    });

    console.log("¡Configuración de Algolia actualizada con éxito!");
  } catch (error) {
    console.error("Error configurando Algolia:", error);
  }
})();
