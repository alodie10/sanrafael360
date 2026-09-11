import { describe, it, expect } from 'vitest';
import {
  isEfemerideVigente,
  isOfertaVigente,
  isPremiumActivo,
  formatParticipanteLabel,
  buildPublicItems,
  normalizeTipo,
  normalizeHttpUrl,
  sanitizeParticipantesExternos,
  countParticipantes,
  slugifyNombre,
} from '../../src/api/efemeride/services/efemeride-utils';

const NOW = new Date('2026-09-04T15:00:00.000Z');

describe('efemeride vigencia', () => {
  it('is active when no dates are set', () => {
    expect(isEfemerideVigente({}, NOW)).toBe(true);
  });

  it('is inactive after vigente_hasta', () => {
    expect(
      isEfemerideVigente({ vigente_hasta: '2026-09-03T23:59:59.000Z' }, NOW)
    ).toBe(false);
  });

  it('is active on the deadline', () => {
    expect(
      isEfemerideVigente({ vigente_hasta: '2026-09-04T23:59:59.000Z' }, NOW)
    ).toBe(true);
  });

  it('is inactive before vigente_desde', () => {
    expect(
      isEfemerideVigente({ vigente_desde: '2026-09-10T00:00:00.000Z' }, NOW)
    ).toBe(false);
  });
});

describe('oferta vigencia', () => {
  it('requires activa=true and current window', () => {
    expect(
      isOfertaVigente(
        {
          activa: true,
          valida_desde: '2026-09-01T00:00:00.000Z',
          valida_hasta: '2026-09-10T00:00:00.000Z',
        },
        NOW
      )
    ).toBe(true);
  });

  it('rejects inactive or expired offers', () => {
    expect(
      isOfertaVigente(
        {
          activa: false,
          valida_desde: '2026-09-01T00:00:00.000Z',
          valida_hasta: '2026-09-10T00:00:00.000Z',
        },
        NOW
      )
    ).toBe(false);
    expect(
      isOfertaVigente(
        {
          activa: true,
          valida_desde: '2026-08-01T00:00:00.000Z',
          valida_hasta: '2026-08-31T00:00:00.000Z',
        },
        NOW
      )
    ).toBe(false);
  });
});

describe('premium picker helpers', () => {
  it('concatenates business name with category', () => {
    expect(formatParticipanteLabel('Bodega Bianchi', 'Bodegas')).toBe(
      'Bodega Bianchi — Bodegas'
    );
    expect(formatParticipanteLabel('Café Central', '')).toBe('Café Central');
  });

  it('treats expired premium as inactive', () => {
    expect(
      isPremiumActivo(
        { is_premium: true, premium_valid_until: '2026-08-01T00:00:00.000Z' },
        NOW
      )
    ).toBe(false);
    expect(isPremiumActivo({ is_premium: true }, NOW)).toBe(true);
  });
});

describe('buildPublicItems', () => {
  it('replaces the business card with vigente offers', () => {
    const items = buildPublicItems(
      [
        {
          nombre: 'Beta',
          slug: 'beta',
          ofertas: [],
        },
        {
          nombre: 'Alfa',
          slug: 'alfa',
          ofertas: [
            {
              titulo: '2x1',
              activa: true,
              valida_desde: '2026-09-01T00:00:00.000Z',
              valida_hasta: '2026-09-10T00:00:00.000Z',
            },
            {
              titulo: 'Vencida',
              activa: true,
              valida_desde: '2026-01-01T00:00:00.000Z',
              valida_hasta: '2026-01-02T00:00:00.000Z',
            },
          ],
        },
      ],
      NOW
    );

    expect(items.map((i) => i.kind)).toEqual(['oferta', 'negocio']);
    expect(items[0].oferta?.titulo).toBe('2x1');
    expect((items[1].negocio as any).nombre).toBe('Beta');
  });
});

describe('tipo y participantes externos', () => {
  it('defaults unknown tipo to efemeride', () => {
    expect(normalizeTipo(undefined)).toBe('efemeride');
    expect(normalizeTipo('feria')).toBe('feria');
  });

  it('normalizes urls without protocol and rejects javascript', () => {
    expect(normalizeHttpUrl('instagram.com/taller')).toEqual({
      ok: true,
      url: 'https://instagram.com/taller',
    });
    expect(normalizeHttpUrl('javascript:alert(1)')).toEqual({ ok: false });
    expect(normalizeHttpUrl('')).toEqual({ ok: true, url: null });
  });

  it('skips empty rows and keeps optional links', () => {
    const result = sanitizeParticipantesExternos([
      { nombre: '  Taller Sur  ', url: 'https://tallersur.com' },
      { nombre: 'Puesto de miel', url: '' },
      { nombre: '   ' },
    ]);
    expect(result).toEqual({
      ok: true,
      items: [
        { nombre: 'Taller Sur', url: 'https://tallersur.com/' },
        { nombre: 'Puesto de miel', url: null },
      ],
    });
  });

  it('counts feria participantes from the free list', () => {
    expect(
      countParticipantes({
        tipo: 'feria',
        negocios: [{ documentId: 'n1' }],
        participantes_externos: [{ nombre: 'A' }, { nombre: 'B' }],
      })
    ).toBe(2);
    expect(countParticipantes({ tipo: 'efemeride', negocios: [{}, {}] })).toBe(2);
  });
});

describe('slugifyNombre', () => {
  it('strips accents and punctuation', () => {
    expect(slugifyNombre('Día del Padre')).toBe('dia-del-padre');
    expect(slugifyNombre('  Feria de Emprendedores!! ')).toBe('feria-de-emprendedores');
  });
});
