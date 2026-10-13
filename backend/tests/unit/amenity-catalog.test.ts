import { describe, expect, it } from 'vitest';
import { AMENITY_CATALOG, AMENITY_RUBROS, amenitySlug } from '../../src/api/atributo/services/amenity-catalog';

const RESERVED_NAMES = ['Heladería', 'Posadas', 'Aire Libre', 'Gastronomía', 'Materiales de construcción'];

describe('amenity catalog', () => {
  it('keeps one record per name and slug', () => {
    const names = AMENITY_CATALOG.map((item) => item.nombre.toLowerCase());
    const slugs = AMENITY_CATALOG.map((item) => item.slug);
    expect(new Set(names).size).toBe(AMENITY_CATALOG.length);
    expect(new Set(slugs).size).toBe(AMENITY_CATALOG.length);
    expect(AMENITY_CATALOG).toHaveLength(57);
  });

  it('derives the slug from the name and avoids existing category tags', () => {
    for (const item of AMENITY_CATALOG) {
      expect(item.slug).toBe(amenitySlug(item.nombre));
      expect(item.icono).toMatch(/^[a-z0-9-]+$/);
      expect(item.rubros.length).toBeGreaterThan(0);
      for (const rubro of item.rubros) {
        expect(AMENITY_RUBROS).toContain(rubro);
      }
    }
    const names = new Set(AMENITY_CATALOG.map((item) => item.nombre.toLowerCase()));
    for (const reserved of RESERVED_NAMES) {
      expect(names.has(reserved.toLowerCase())).toBe(false);
    }
  });

  it('shares Wifi and Accesible, and keeps Cochera apart from Estacionamiento', () => {
    const byName = new Map(AMENITY_CATALOG.map((item) => [item.nombre, item]));
    expect(byName.get('Wifi')?.rubros).toEqual(['alojamiento', 'gastronomia', 'comercios']);
    expect(byName.get('Accesible')?.rubros).toEqual(['alojamiento', 'gastronomia', 'comercios']);
    expect(byName.get('Cochera')?.rubros).toEqual(['alojamiento']);
    expect(byName.get('Estacionamiento')?.rubros).toEqual(['gastronomia', 'comercios']);
    expect(byName.get('Cochera')?.icono).toBe('car');
    expect(byName.get('Estacionamiento')?.icono).toBe('car');
    expect(byName.get('Alarma')?.rubros).toEqual(['alojamiento']);
    expect(byName.get('Servicio de emergencia médica')?.rubros).toEqual(['alojamiento']);
    expect(byName.get('Terraza')?.rubros).toEqual(['alojamiento']);
    expect(byName.get('Terraza / aire libre')?.rubros).toEqual(['gastronomia']);
    expect(byName.get('Balcón')?.rubros).toEqual(['alojamiento']);
    expect(byName.get('Cámaras de seguridad')?.rubros).toEqual(['alojamiento']);
  });
});
