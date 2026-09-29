import { describe, expect, it } from 'vitest';
import { foldAlcanzados, filterAlcanzados, SIN_CAMPANA } from '../../src/api/crm/crm-alcanzados';

describe('foldAlcanzados', () => {
  it('keeps every campaign and the latest WhatsApp per contact', () => {
    const rows = [
      {
        documentId: 'a1',
        createdAt: '2026-09-18T12:00:00.000Z',
        campana: 'SR360',
        plantilla_index: 0,
        contacto: { documentId: 'c1', nombre: 'Taller', categoria: { nombre: 'Taller' } },
      },
      {
        documentId: 'a2',
        createdAt: '2026-09-01T12:00:00.000Z',
        campana: 'Seguimiento',
        plantilla_index: 2,
        contacto: { documentId: 'c1', nombre: 'Taller' },
      },
      {
        documentId: 'a3',
        createdAt: '2026-09-18T11:00:00.000Z',
        contacto: { documentId: 'c2', nombre: 'Salon' },
      },
    ];
    const folded = foldAlcanzados(rows);
    expect(folded).toHaveLength(2);
    expect(folded[0].nombre).toBe('Taller');
    expect(folded[0].enviadoAt).toBe('2026-09-18T12:00:00.000Z');
    expect(folded[0].envios.map((envio) => envio.campana)).toEqual(['SR360', 'Seguimiento']);
    expect(folded[0].envios[0].plantillaIndex).toBe(0);
    expect(folded[1].nombre).toBe('Salon');
    expect(folded[1].envios[0].campana).toBe(SIN_CAMPANA);
    expect(folded[1].envios[0].plantillaIndex).toBeNull();
  });

  it('keeps the contact comment and filters by campaign date', () => {
    const folded = foldAlcanzados([
      {
        documentId: 'a1',
        createdAt: '2026-09-18T12:00:00.000Z',
        campana: 'SR360',
        plantilla_index: 0,
        contacto: { documentId: 'c1', nombre: 'Taller', nota: 'Es peluquería', estado: 'contactado' },
      },
      {
        documentId: 'a2',
        createdAt: '2026-09-01T12:00:00.000Z',
        campana: 'Seguimiento',
        plantilla_index: 2,
        contacto: { documentId: 'c1', nombre: 'Taller', nota: 'Es peluquería', estado: 'contactado' },
      },
    ]);
    expect(folded[0].nota).toBe('Es peluquería');
    expect(filterAlcanzados(folded, { estado: 'error' })).toHaveLength(0);
    expect(filterAlcanzados(folded, { estado: 'contactado', desde: '2026-09-18' })).toHaveLength(1);
    expect(filterAlcanzados(folded, { campana: 'SR360' })).toHaveLength(1);
    expect(filterAlcanzados(folded, { campana: 'Oferta' })).toHaveLength(0);
    expect(filterAlcanzados(folded, { campana: 'Seguimiento', desde: '2026-09-01', hasta: '2026-09-01' })).toHaveLength(1);
    expect(filterAlcanzados(folded, { desde: '2026-09-01', hasta: '2026-09-01' })).toHaveLength(0);
  });
});
