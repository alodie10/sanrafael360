import { describe, expect, it } from 'vitest';
import { normalizeNombreKey, parseCrmIngestPayload } from '../../src/api/crm/crm-ingest';

describe('parseCrmIngestPayload', () => {
  it('reads a plain JSON array', () => {
    const items = parseCrmIngestPayload(
      JSON.stringify([{ nombre: 'Taller X', telefono: '2611234567' }])
    );
    expect(items).toEqual([
      { nombre: 'Taller X', telefono: '2611234567', instagram: '', nota: '' },
    ]);
  });

  it('extracts the first array from markdown fences', () => {
    const raw = 'Acá va:\n```json\n[{"nombre":"Salon Y"}]\n```\n';
    expect(parseCrmIngestPayload(raw)[0].nombre).toBe('Salon Y');
  });

  it('drops rows without nombre', () => {
    const items = parseCrmIngestPayload(
      JSON.stringify([{ telefono: '1' }, { nombre: 'Ok' }])
    );
    expect(items).toHaveLength(1);
    expect(items[0].nombre).toBe('Ok');
  });

  it('caps at 15 items', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ nombre: `N${i}` }));
    expect(parseCrmIngestPayload(JSON.stringify(rows))).toHaveLength(15);
  });

  it('rejects empty paste', () => {
    expect(() => parseCrmIngestPayload('   ')).toThrow(/Pegá el JSON/);
  });

  it('rejects text without an array', () => {
    expect(() => parseCrmIngestPayload('hola')).toThrow(/array JSON/);
  });
});

describe('normalizeNombreKey', () => {
  it('folds case, accents and spaces', () => {
    expect(normalizeNombreKey('  Café  Sol  ')).toBe('cafe sol');
  });
});
