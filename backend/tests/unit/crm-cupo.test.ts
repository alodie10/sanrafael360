import { describe, expect, it } from 'vitest';
import { cupoFromComercio } from '../../src/api/crm/crm-cupo';

describe('cupoFromComercio', () => {
  it('uses the CRM stored count for today', () => {
    expect(
      cupoFromComercio(
        { cupo_wsp_fecha: '2026-09-17', cupo_wsp_count: 3, cupo_wsp_limite: 25 },
        '2026-09-17'
      )
    ).toEqual({ enviados: 3, limite: 25, fecha: '2026-09-17' });
  });

  it('resets on a new day without reading prospección', () => {
    expect(
      cupoFromComercio(
        { cupo_wsp_fecha: '2026-09-16', cupo_wsp_count: 22, cupo_wsp_limite: 25 },
        '2026-09-17'
      ).enviados
    ).toBe(0);
  });

  it('honors a custom limite on the tenant', () => {
    expect(
      cupoFromComercio(
        { cupo_wsp_fecha: '2026-09-17', cupo_wsp_count: 1, cupo_wsp_limite: 10 },
        '2026-09-17'
      ).limite
    ).toBe(10);
  });
});
