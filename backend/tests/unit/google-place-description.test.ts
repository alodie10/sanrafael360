import { describe, it, expect } from 'vitest';
import {
  resolvePlaceTypeLabel,
  buildGoogleImportDescription,
} from '../../src/utils/google-place-description';

describe('resolvePlaceTypeLabel', () => {
  it('maps restaurant as Restaurante and ignores generic types', () => {
    expect(
      resolvePlaceTypeLabel(['restaurant', 'food', 'point_of_interest', 'establishment'])
    ).toBe('Restaurante');
  });

  it('returns null when only generic types are present', () => {
    expect(resolvePlaceTypeLabel(['point_of_interest', 'establishment'])).toBeNull();
  });
});

describe('buildGoogleImportDescription', () => {
  it('prefers Google editorial summary when present', () => {
    expect(
      buildGoogleImportDescription({
        editorialSummary: 'Restaurante de cocina regional en el centro.',
        tipo: 'Restaurante',
        direccion: 'San Rafael, Mendoza',
        nombre: 'Ruka',
      })
    ).toBe('Restaurante de cocina regional en el centro.');
  });

  it('uses place type and address instead of an import disclaimer', () => {
    expect(
      buildGoogleImportDescription({
        tipo: 'Restaurante',
        direccion: 'San Martín 123, San Rafael, Mendoza',
        nombre: 'Ruka',
      })
    ).toBe('Restaurante en San Martín 123, San Rafael, Mendoza.');
  });

  it('falls back to the business name and address', () => {
    expect(
      buildGoogleImportDescription({
        direccion: 'San Rafael, Mendoza',
        nombre: 'Ruka',
      })
    ).toBe('Ruka en San Rafael, Mendoza.');
  });
});
