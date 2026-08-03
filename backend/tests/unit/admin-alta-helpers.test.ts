import { describe, it, expect } from 'vitest';
import {
  normalizeSlug,
  resolveRecursoNames,
} from '../../src/api/reserva/services/admin-alta-comercio';

describe('admin-alta-comercio helpers (E1)', () => {
  it('normaliza slug con acentos y espacios', () => {
    expect(normalizeSlug('Café & Bar San Rafael')).toBe('cafe-bar-san-rafael');
  });

  it('default 4 puestos', () => {
    expect(resolveRecursoNames({ negocioDocumentId: 'x' })).toEqual([
      'Puesto 1',
      'Puesto 2',
      'Puesto 3',
      'Puesto 4',
    ]);
  });

  it('respeta nombres custom', () => {
    expect(
      resolveRecursoNames({
        negocioDocumentId: 'x',
        recursos: [' Mesa A ', '', 'Mesa B'],
      })
    ).toEqual(['Mesa A', 'Mesa B']);
  });

  it('cantidad_recursos = 2', () => {
    expect(resolveRecursoNames({ negocioDocumentId: 'x', cantidad_recursos: 2 })).toEqual([
      'Puesto 1',
      'Puesto 2',
    ]);
  });
});
