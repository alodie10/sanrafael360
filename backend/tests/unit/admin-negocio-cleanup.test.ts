import { describe, expect, it } from 'vitest';
import { collectMediaFiles } from '../../src/api/negocio/services/admin-negocio-cleanup';
import { isPremiumListingActive, neverBeenPremium } from '../../src/utils/premium-vigencia';

describe('collectMediaFiles', () => {
  it('dedupes logo, cover and gallery', () => {
    const files = collectMediaFiles({
      logo: { id: 1, url: '/a.jpg' },
      imagen_portada: { id: 1, url: '/a.jpg' },
      galeria: [{ id: 2, url: '/b.jpg' }, { id: 2, url: '/b.jpg' }],
    });
    expect(files.map((file) => file.id)).toEqual([1, 2]);
  });

  it('ignores empty media', () => {
    expect(collectMediaFiles({ logo: null, imagen_portada: null, galeria: [] })).toEqual([]);
  });
});

describe('purge gate', () => {
  it('blocks listings that already had vigencia', () => {
    expect(
      neverBeenPremium({
        is_premium: false,
        premium_valid_until: '2024-01-01T12:00:00.000Z',
      })
    ).toBe(false);
  });
});

describe('delete gate', () => {
  it('blocks currently premium listings', () => {
    expect(
      isPremiumListingActive({
        is_premium: true,
        premium_valid_until: '2099-01-01T12:00:00.000Z',
      })
    ).toBe(true);
  });

  it('allows delete after premium expires', () => {
    expect(
      isPremiumListingActive({
        is_premium: false,
        premium_valid_until: '2020-01-01T12:00:00.000Z',
      })
    ).toBe(false);
  });
});
