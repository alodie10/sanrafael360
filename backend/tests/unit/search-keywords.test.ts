import { describe, it, expect } from 'vitest';
import {
  buildSearchKeywords,
  parseKeywordList,
  significantSearchTerms,
  uniqueTerms,
} from '../../src/api/negocio/services/search-keywords';

describe('search keyword builder', () => {
  it('maps ferretería products to the rubro', () => {
    const terms = buildSearchKeywords({ slug: 'ferreterias', nombre: 'Ferreterías' });
    expect(terms).toEqual(expect.arrayContaining(['martillo', 'tornillo', 'taladro']));
  });

  it('maps tire words to gomerías', () => {
    const terms = buildSearchKeywords({
      slug: 'talleres_gomerias',
      nombre: 'Talleres Mecánicos - Gomerías',
    });
    expect(terms).toEqual(expect.arrayContaining(['neumatico', 'llanta', 'cubierta']));
  });

  it('maps brake pads to auto parts', () => {
    const terms = buildSearchKeywords({
      slug: 'repuestos_automotor',
      nombre: 'Repuestos Automotrices',
    });
    expect(terms).toEqual(expect.arrayContaining(['pastillas de freno', 'pastillas', 'freno']));
  });

  it('inherits parent rubro terms', () => {
    const terms = buildSearchKeywords({
      slug: 'pizzeria',
      nombre: 'Pizzeria',
      parent: { slug: 'gastronomia', nombre: 'Gastronomía' },
    });
    expect(terms).toEqual(expect.arrayContaining(['pizza', 'comer']));
  });

  it('appends CMS palabras_clave without duplicating', () => {
    const terms = buildSearchKeywords({
      slug: 'ferreterias',
      palabras_clave: 'martillo, silicona,  , tarugo',
    });
    expect(terms).toEqual(expect.arrayContaining(['martillo', 'silicona', 'tarugo']));
    expect(terms.filter((t) => t.toLowerCase() === 'martillo')).toHaveLength(1);
  });
});

describe('parseKeywordList', () => {
  it('splits commas and newlines', () => {
    expect(parseKeywordList('martillo, llanta\nfreno')).toEqual(['martillo', 'llanta', 'freno']);
  });
});

describe('significantSearchTerms', () => {
  it('keeps pastillas de freno and falls back to freno', () => {
    expect(significantSearchTerms('pastillas de freno')).toEqual(['pastillas de freno', 'freno']);
  });

  it('does not duplicate a single word', () => {
    expect(significantSearchTerms('martillo')).toEqual(['martillo']);
  });
});

describe('uniqueTerms', () => {
  it('treats accented duplicates as the same term', () => {
    expect(uniqueTerms(['neumático', 'Neumatico', 'llanta'])).toEqual(['neumático', 'llanta']);
  });
});
