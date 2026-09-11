import { describe, it, expect } from 'vitest';
import { slugifyNegocioNombre, uniqueNegocioSlug } from '../../src/api/negocio/services/negocio-utils';

describe('slugifyNegocioNombre', () => {
  it('normaliza acentos y puntuación', () => {
    expect(slugifyNegocioNombre('Café & Bar San Rafael')).toBe('cafe-bar-san-rafael');
  });
});

describe('uniqueNegocioSlug', () => {
  it('keeps the base slug when free', async () => {
    const slug = await uniqueNegocioSlug(async () => false, 'Finca Los Álamos');
    expect(slug).toBe('finca-los-alamos');
  });

  it('appends a suffix when the base is taken', async () => {
    const taken = new Set(['taller-sur', 'taller-sur-2']);
    const slug = await uniqueNegocioSlug(async (candidate) => taken.has(candidate), 'Taller Sur');
    expect(slug).toBe('taller-sur-3');
  });
});
