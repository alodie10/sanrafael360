/**
 * Ranking: nombre → rubro → intención (producto→categoría) → etiquetas → descripción.
 * Typos en descripción siguen apagados (inyección ≠ intención).
 */
export const ALGOLIA_SEARCHABLE_ATTRIBUTES = [
  'nombre',
  'categoria',
  'search_keywords',
  'atributos',
  'descripcion',
] as const;

export const ALGOLIA_INDEX_SETTINGS = {
  searchableAttributes: [...ALGOLIA_SEARCHABLE_ATTRIBUTES],
  attributesToHighlight: [...ALGOLIA_SEARCHABLE_ATTRIBUTES],
  typoTolerance: true as const,
  disableTypoToleranceOnAttributes: ['descripcion'],
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 12,
  exactOnSingleWordQuery: 'word' as const,
  removeStopWords: ['es' as const],
  ignorePlurals: ['es' as const],
  removeWordsIfNoResults: 'firstWords' as const,
  customRanking: ['desc(is_premium)'],
  indexLanguages: ['es' as const],
  queryLanguages: ['es' as const],
};
