/**
 * Ranking: nombre → etiquetas → descripción.
 * Sin typos: "inyección" no matchea "intención".
 */
export const ALGOLIA_INDEX_SETTINGS = {
  searchableAttributes: ['nombre', 'atributos', 'descripcion'],
  typoTolerance: false as const,
  exactOnSingleWordQuery: 'word' as const,
  customRanking: ['desc(is_premium)'],
  attributesToHighlight: ['nombre', 'atributos', 'descripcion'],
  indexLanguages: ['es' as const],
  queryLanguages: ['es' as const],
};
