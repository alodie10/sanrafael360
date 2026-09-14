import { describe, expect, it } from 'vitest';
import {
  buildAdminPagosPayload,
  normalizePagos,
  pagoYearMonth,
  sumApprovedPagos,
} from '../../src/api/negocio/services/admin-pagos-utils';

describe('admin-pagos-utils', () => {
  it('unwraps pagos from Strapi { data } envelopes', () => {
    expect(normalizePagos({ data: [{ monto: 10, estado: 'aprobado' }] })).toHaveLength(1);
    expect(normalizePagos([{ monto: 10, estado: 'aprobado' }])).toHaveLength(1);
    expect(normalizePagos(null)).toEqual([]);
  });

  it('sums only approved pagos and respects month in Argentina timezone', () => {
    const pagos = [
      { monto: 1000, estado: 'aprobado', fecha_pago: '2026-09-01T10:00:00.000Z' },
      { monto: '2500', estado: 'aprobado', fecha_pago: '2026-08-15T15:00:00.000Z' },
      { monto: 900, estado: 'pendiente', fecha_pago: '2026-09-02T10:00:00.000Z' },
      { monto: 50, estado: 'aprobado', fecha_pago: '2026-09-01T02:00:00.000Z' },
    ];

    expect(sumApprovedPagos(pagos)).toBe(3550);
    expect(sumApprovedPagos(pagos, '2026-09')).toBe(1000);
    expect(sumApprovedPagos(pagos, '2026-08')).toBe(2550);
    expect(pagoYearMonth(pagos[3])).toBe('2026-08');
  });

  it('keeps historical total independent of Activos filter', () => {
    const now = new Date('2026-09-14T15:00:00.000Z');
    const negocios = [
      {
        nombre: 'Activo',
        is_premium: true,
        premium_valid_until: '2026-12-01T00:00:00.000Z',
        pagos: [{ monto: 1000, estado: 'aprobado', fecha_pago: '2026-03-01T12:00:00.000Z' }],
      },
      {
        nombre: 'Vencido',
        is_premium: true,
        premium_valid_until: '2026-01-01T00:00:00.000Z',
        pagos: [{ monto: 4000, estado: 'aprobado', fecha_pago: '2025-12-01T12:00:00.000Z' }],
      },
    ];
    const allPagos = negocios.flatMap((n) => n.pagos);

    const activos = buildAdminPagosPayload(negocios, allPagos, { filterType: 'premium' }, now);
    expect(activos.data).toHaveLength(1);
    expect(activos.meta.stats.total).toBe(5000);
    expect(activos.meta.stats.active).toBe(1);

    const todos = buildAdminPagosPayload(negocios, allPagos, { filterType: 'all' }, now);
    expect(todos.data).toHaveLength(2);
    expect(todos.meta.stats.total).toBe(5000);
  });
});
