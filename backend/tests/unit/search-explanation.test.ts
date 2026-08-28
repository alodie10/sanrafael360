import { describe, it, expect } from 'vitest';
import { ALGOLIA_INDEX_SETTINGS } from '../../src/api/negocio/services/algolia-index-settings';
import { buildSearchExplanation } from '../../../frontend/src/lib/search-match';

describe('Algolia index settings', () => {
  it('searches nombre, then tags, then description — without typos', () => {
    expect(ALGOLIA_INDEX_SETTINGS.searchableAttributes).toEqual([
      'nombre',
      'atributos',
      'descripcion',
    ]);
    expect(ALGOLIA_INDEX_SETTINGS.typoTolerance).toBe(false);
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

  it('breaks down mixed matches instead of a generic para', () => {
    expect(buildSearchExplanation(4, 'pizza', ['nombre', 'descripcion', 'atributos', 'descripcion']))
      .toBe('Se encontraron 4 comercios con pizza: 1 en el nombre, 1 etiquetado, 2 en la descripción');
  });
});
