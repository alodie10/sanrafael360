import { describe, expect, it } from 'vitest';
import { rubrosFromSlugs, visibleAmenities } from '../../../frontend/src/lib/place-amenity-rubros';

const catalog = [
  { nombre: 'Wifi', tipo: 'facilidad', documentId: 'wifi' },
  { nombre: 'Piscina', tipo: 'facilidad', documentId: 'piscina' },
  { nombre: 'Delivery', tipo: 'facilidad', documentId: 'delivery' },
  { nombre: 'Envíos a domicilio', tipo: 'facilidad', documentId: 'envios' },
  { nombre: 'Cabañas', tipo: 'tag', documentId: 'cabanas' },
  { nombre: 'Alfajores', tipo: 'tag', documentId: 'alfajores' },
];

describe('editor de amenities por rubro', () => {
  it('cabañas solo muestra alojamiento', () => {
    const names = visibleAmenities(catalog, 'cabanas', []).map((item) => item.nombre);
    expect(rubrosFromSlugs(['cabanas'])).toEqual(['alojamiento']);
    expect(names).toEqual(['Piscina', 'Wifi']);
  });

  it('un restaurante no ve pileta ni envíos', () => {
    const names = visibleAmenities(catalog, 'restaurante', []).map((item) => item.nombre);
    expect(names).toEqual(['Delivery', 'Wifi']);
  });

  it('conserva una facilidad ya marcada aunque no sea del rubro', () => {
    const names = visibleAmenities(catalog, 'cabanas', ['delivery']).map((item) => item.nombre);
    expect(names).toContain('Delivery');
    expect(names).not.toContain('Cabañas');
  });
});
