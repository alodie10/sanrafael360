import { describe, expect, it } from 'vitest';
import { cupoFromComercio, cupoTrasErrorWsp, resumenCupoActividades } from '../../src/api/crm/crm-cupo';

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

describe('cupoTrasErrorWsp', () => {
  const today = '2026-09-22';
  const base = {
    fromEstado: 'contactado',
    toEstado: 'error',
    today,
    storedFecha: today,
    storedCount: 25,
    enviosQueConsumieronHoy: 1,
    devolucionesHoy: 0,
  };

  it('returns one slot when Error WSP is marked the same day', () => {
    expect(cupoTrasErrorWsp(base)).toBe(24);
  });

  it('does not refund a failed send from another day', () => {
    expect(cupoTrasErrorWsp({ ...base, enviosQueConsumieronHoy: 0 })).toBeNull();
    expect(cupoTrasErrorWsp({ ...base, storedFecha: '2026-09-21' })).toBeNull();
  });

  it('does not double-refund the same error', () => {
    expect(cupoTrasErrorWsp({ ...base, fromEstado: 'error' })).toBeNull();
    expect(cupoTrasErrorWsp({ ...base, devolucionesHoy: 1 })).toBeNull();
  });
});

describe('resumenCupoActividades', () => {
  it('counts a real WhatsApp today and ignores a number that never opened', () => {
    const today = '2026-09-22';
    expect(
      resumenCupoActividades(
        [
          { tipo: 'envio_whatsapp', texto: 'Hola', createdAt: `${today}T15:00:00.000-03:00` },
          {
            tipo: 'envio_whatsapp',
            texto: 'WhatsApp no enviado: teléfono inválido. Hola',
            createdAt: `${today}T16:00:00.000-03:00`,
          },
          {
            tipo: 'envio_whatsapp',
            texto: 'Hola ayer',
            createdAt: '2026-09-21T15:00:00.000-03:00',
          },
        ],
        today
      )
    ).toEqual({ enviosQueConsumieronHoy: 1, devolucionesHoy: 0 });
  });
});
