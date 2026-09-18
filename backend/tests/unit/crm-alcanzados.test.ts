import { describe, expect, it } from 'vitest';
import { foldAlcanzados } from '../../src/api/crm/crm-alcanzados';

describe('foldAlcanzados', () => {
  it('keeps the latest WhatsApp per contact', () => {
    const rows = [
      {
        documentId: 'a1',
        createdAt: '2026-09-18T12:00:00.000Z',
        contacto: { documentId: 'c1', nombre: 'Taller', categoria: { nombre: 'Taller' } },
      },
      {
        documentId: 'a2',
        createdAt: '2026-09-17T12:00:00.000Z',
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
    expect(folded[1].nombre).toBe('Salon');
  });
});
