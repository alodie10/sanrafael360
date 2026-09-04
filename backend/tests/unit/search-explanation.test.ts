import { describe, it, expect } from 'vitest';
import { ALGOLIA_INDEX_SETTINGS } from '../../src/api/negocio/services/algolia-index-settings';
import { buildSearchExplanation, matchFieldFromAlgoliaHit, matchFieldFromText, queryVariants } from '../../../frontend/src/lib/search-match';

describe('Algolia index settings', () => {
  it('searches nombre, rubro, intent keywords, tags, then description', () => {
    expect(ALGOLIA_INDEX_SETTINGS.searchableAttributes).toEqual([
      'nombre',
      'categoria',
      'search_keywords',
      'atributos',
      'descripcion',
    ]);
  });

  it('keeps description free of typos so inyección ≠ intención', () => {
    expect(ALGOLIA_INDEX_SETTINGS.disableTypoToleranceOnAttributes).toEqual(['descripcion']);
    expect(ALGOLIA_INDEX_SETTINGS.minWordSizefor2Typos).toBe(12);
  });

  it('drops leading words when a product query has no hits', () => {
    expect(ALGOLIA_INDEX_SETTINGS.removeWordsIfNoResults).toBe('firstWords');
    expect(ALGOLIA_INDEX_SETTINGS.removeStopWords).toEqual(['es']);
  });

  it('keeps premium as custom ranking after attribute order', () => {
    expect(ALGOLIA_INDEX_SETTINGS.customRanking).toEqual(['desc(is_premium)']);
  });
});

describe('search result explanation', () => {
  it('names the description when all hits matched there', () => {
    expect(buildSearchExplanation(3, 'Inyección', ['descripcion', 'descripcion', 'descripcion']))
      .toBe('Se encontraron 3 comercios con Inyección en su descripción');
  });

  it('names the title when all hits matched the nombre', () => {
    expect(buildSearchExplanation(2, 'Cabaña', ['nombre', 'nombre']))
      .toBe('Se encontraron 2 comercios con Cabaña en su nombre');
  });

  it('names tags when all hits matched atributos', () => {
    expect(buildSearchExplanation(3, 'pet friendly', ['atributos', 'atributos', 'atributos']))
      .toBe('Se encontraron 3 comercios etiquetados como pet friendly');
  });

  it('names intent keywords when the query is a product not a shop name', () => {
    expect(buildSearchExplanation(11, 'martillo', Array(11).fill('keywords')))
      .toBe('Se encontraron 11 comercios relacionados con martillo');
  });

  it('breaks down mixed matches instead of a generic para', () => {
    expect(buildSearchExplanation(4, 'pizza', ['nombre', 'descripcion', 'atributos', 'descripcion']))
      .toBe('Se encontraron 4 comercios con pizza: 1 en el nombre, 1 etiquetado, 2 en la descripción');
  });
});

describe('queryVariants', () => {
  it('keeps pastillas de freno and falls back to freno', () => {
    expect(queryVariants('pastillas de freno')).toEqual(['pastillas de freno', 'freno']);
  });

  it('classifies FRENOS BOCCHIA as a nombre match for pastillas de freno', () => {
    expect(matchFieldFromText(
      { nombre: 'FRENOS BOCCHIA', categoria: { nombre: 'Repuestos Automotrices' } } as any,
      'pastillas de freno'
    )).toBe('nombre');
  });

  it('classifies a ferretería hit as keywords when martillo is only in search_keywords', () => {
    expect(matchFieldFromAlgoliaHit(
      { nombre: 'Ferretería Villalobos', categoria: 'Ferreterías', search_keywords: ['martillo', 'tornillo'] },
      'martillo'
    )).toBe('keywords');
  });
});
