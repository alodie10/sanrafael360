import { describe, it, expect } from 'vitest';
import {
  resolveVigenciaUpdate,
  shouldDownloadPlacesPhotos,
  neverBeenPremium,
  isTouristInterestCategory,
  showsPublicFicha,
} from '../../src/utils/premium-vigencia';

describe('premium-vigencia utils', () => {
  it('marks premium inactive when date is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const result = resolveVigenciaUpdate(dateStr);
    expect(result.is_premium).toBe(false);
    expect(result.validUntilISO).not.toBeNull();
  });

  it('marks premium active when date is today or future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const result = resolveVigenciaUpdate(dateStr);
    expect(result.is_premium).toBe(true);
    expect(result.validUntilISO).not.toBeNull();
  });

  it('returns inactive when premium_valid_until is null', () => {
    const result = resolveVigenciaUpdate(null);
    expect(result.is_premium).toBe(false);
    expect(result.validUntilISO).toBeNull();
  });
});

describe('shouldDownloadPlacesPhotos', () => {
  it('skips Places photo hosting for free listings', () => {
    expect(shouldDownloadPlacesPhotos({ is_premium: false })).toBe(false);
  });

  it('skips Places photo hosting when premium expired', () => {
    expect(
      shouldDownloadPlacesPhotos({
        is_premium: true,
        premium_valid_until: '2020-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('allows Places photo hosting for active premium', () => {
    expect(
      shouldDownloadPlacesPhotos({
        is_premium: true,
        premium_valid_until: '2099-01-01T00:00:00.000Z',
      })
    ).toBe(true);
  });

  it('allows Places photo hosting for tourist interest listings', () => {
    expect(
      shouldDownloadPlacesPhotos({
        is_premium: false,
        categoria: { nombre: 'Interés Turístico' },
      })
    ).toBe(true);
  });
});

describe('neverBeenPremium', () => {
  it('is true when the listing never had vigencia', () => {
    expect(neverBeenPremium({ is_premium: false })).toBe(true);
    expect(neverBeenPremium({ is_premium: false, premium_valid_until: null })).toBe(true);
  });

  it('is false for active or expired premium', () => {
    expect(neverBeenPremium({ is_premium: true })).toBe(false);
    expect(
      neverBeenPremium({
        is_premium: false,
        premium_valid_until: '2020-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('is false for Interés Turístico', () => {
    expect(
      neverBeenPremium({
        is_premium: false,
        categoria: { nombre: 'Interés Turístico', slug: 'interes-turistico' },
      })
    ).toBe(false);
  });
});

describe('showsPublicFicha', () => {
  it('keeps tourist interest as a public ficha', () => {
    expect(isTouristInterestCategory({ categoria: 'Interés Turístico' })).toBe(true);
    expect(
      showsPublicFicha({
        is_premium: false,
        categoria: { nombre: 'Interés Turístico' },
      })
    ).toBe(true);
    expect(
      showsPublicFicha({
        is_premium: false,
        categoria: { nombre: 'Gastronomía' },
      })
    ).toBe(false);
  });
});
