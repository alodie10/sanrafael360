import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import {
  assertEstado,
  createdAtRange,
  estadoYNotaPatch,
  parseCrmListQuery,
} from '../../src/api/crm/crm-estado';

describe('crm-estado', () => {
  it('accepts error and lets a lead go back to nuevo', () => {
    expect(assertEstado('error')).toBe('error');
    expect(assertEstado('nuevo')).toBe('nuevo');
    expect(() => assertEstado('invalido')).toThrow(ValidationError);
  });

  it('lists by estado without restricting to the work queue', () => {
    expect(parseCrmListQuery({}).soloCola).toBe(true);
    expect(parseCrmListQuery({ estado: 'error' })).toEqual({
      estado: 'error',
      desde: undefined,
      hasta: undefined,
      soloCola: false,
    });
  });

  it('keeps date filters and can pin the queue', () => {
    expect(parseCrmListQuery({ desde: '2026-09-01', hasta: '2026-09-18', cola: '1' })).toEqual({
      estado: undefined,
      desde: '2026-09-01',
      hasta: '2026-09-18',
      soloCola: true,
    });
    expect(createdAtRange('2026-09-01', '2026-09-18')).toEqual({
      $gte: '2026-09-01T00:00:00.000',
      $lte: '2026-09-18T23:59:59.999',
    });
  });

  it('re-queues a lead when the status goes back to nuevo', () => {
    expect(estadoYNotaPatch({ estado: 'nuevo' })).toEqual({ estado: 'nuevo', en_cola: true });
    expect(estadoYNotaPatch({ estado: 'error', nota: 'wa.me falló' })).toEqual({
      estado: 'error',
      nota: 'wa.me falló',
    });
  });

  it('opens the full lead list when filtering by date', () => {
    expect(parseCrmListQuery({ desde: '2026-09-01' }).soloCola).toBe(false);
  });
});
