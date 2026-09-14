import { describe, expect, it } from 'vitest';
import {
  isOfertaEnVentana,
  mergePublicVigenciaFilters,
  planVigenciaUpdates,
  shouldAutoPublish,
  stampActivaOnPayload,
} from '../../src/api/oferta/services/oferta-vigencia';

const NOW = new Date('2026-09-14T13:00:00.000Z');

describe('isOfertaEnVentana', () => {
  it('is true on the inclusive window', () => {
    expect(
      isOfertaEnVentana(
        {
          valida_desde: '2026-09-14T00:00:00.000Z',
          valida_hasta: '2026-09-14T23:59:59.999Z',
        },
        NOW
      )
    ).toBe(true);
  });

  it('is false before valida_desde and after valida_hasta', () => {
    expect(
      isOfertaEnVentana(
        {
          valida_desde: '2026-09-15T00:00:00.000Z',
          valida_hasta: '2026-09-20T23:59:59.999Z',
        },
        NOW
      )
    ).toBe(false);
    expect(
      isOfertaEnVentana(
        {
          valida_desde: '2026-09-01T00:00:00.000Z',
          valida_hasta: '2026-09-13T23:59:59.999Z',
        },
        NOW
      )
    ).toBe(false);
  });

  it('is false without both dates', () => {
    expect(isOfertaEnVentana({ valida_desde: '2026-09-01T00:00:00.000Z' }, NOW)).toBe(false);
    expect(isOfertaEnVentana({}, NOW)).toBe(false);
  });
});

describe('stampActivaOnPayload', () => {
  it('derives activa from payload dates', () => {
    const data: Record<string, unknown> = {
      valida_desde: '2026-09-14T00:00:00.000Z',
      valida_hasta: '2026-09-20T23:59:59.999Z',
      activa: false,
    };
    stampActivaOnPayload(data);
    expect(data.activa).toBe(true);
  });

  it('uses existing dates when the payload is a partial update', () => {
    const data: Record<string, unknown> = { titulo: 'Promo' };
    stampActivaOnPayload(data, {
      valida_desde: '2026-08-01T00:00:00.000Z',
      valida_hasta: '2026-08-31T23:59:59.999Z',
    });
    expect(data.activa).toBe(false);
  });
});

describe('planVigenciaUpdates', () => {
  it('activates and deactivates only mismatched rows', () => {
    const updates = planVigenciaUpdates(
      [
        {
          documentId: 'on',
          activa: false,
          valida_desde: '2026-09-01T00:00:00.000Z',
          valida_hasta: '2026-09-30T23:59:59.999Z',
        },
        {
          documentId: 'off',
          activa: true,
          valida_desde: '2026-08-01T00:00:00.000Z',
          valida_hasta: '2026-08-31T23:59:59.999Z',
        },
        {
          documentId: 'ok',
          activa: true,
          valida_desde: '2026-09-01T00:00:00.000Z',
          valida_hasta: '2026-09-30T23:59:59.999Z',
        },
      ],
      NOW
    );
    expect(updates).toEqual([
      { documentId: 'on', activa: true },
      { documentId: 'off', activa: false },
    ]);
  });
});


describe('mergePublicVigenciaFilters', () => {
  it('keeps caller filters and forces the date window', () => {
    const merged = mergePublicVigenciaFilters({ activa: { $eq: true } }, NOW);
    expect(merged.activa).toEqual({ $eq: true });
    expect(merged.valida_desde).toEqual({ $lte: NOW.toISOString() });
    expect(merged.valida_hasta).toEqual({ $gte: NOW.toISOString() });
  });
});

describe('shouldAutoPublish', () => {
  it('skips already published or in-flight documents', () => {
    const publishing = new Set(['busy']);
    expect(shouldAutoPublish({ documentId: 'n1', publishedAt: '2026-09-14T10:00:00.000Z' }, publishing)).toBe(
      false
    );
    expect(shouldAutoPublish({ documentId: 'busy' }, publishing)).toBe(false);
    expect(shouldAutoPublish({ documentId: 'draft' }, publishing)).toBe(true);
  });
});
