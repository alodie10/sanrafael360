import { describe, expect, it } from 'vitest';
import {
  WHATSAPP_DAILY_LIMIT,
  asDateOnly,
  nextCupoCount,
  resolveCupoWhatsapp,
} from '../../src/api/prospeccion/prospeccion-cupo';
import { calendarDateInTimeZone } from '../../src/utils/prospeccion-saludo';

describe('calendarDateInTimeZone', () => {
  it('maps 09:07 ART to the Mendoza calendar date', () => {
    expect(calendarDateInTimeZone(new Date('2026-09-17T12:07:00.000Z'))).toBe('2026-09-17');
  });

  it('stays on the previous day just before ART midnight', () => {
    expect(calendarDateInTimeZone(new Date('2026-09-18T02:59:00.000Z'))).toBe('2026-09-17');
  });

  it('rolls at 00:00 ART', () => {
    expect(calendarDateInTimeZone(new Date('2026-09-18T03:00:00.000Z'))).toBe('2026-09-18');
  });
});

describe('resolveCupoWhatsapp', () => {
  it('uses the stored count when the fecha is today', () => {
    expect(
      resolveCupoWhatsapp({
        storedFecha: '2026-09-17',
        storedCount: 8,
        today: '2026-09-17',
        contactosHoy: 3,
      })
    ).toEqual({ enviados: 8, limite: WHATSAPP_DAILY_LIMIT, fecha: '2026-09-17' });
  });

  it('seeds from contactos alcanzados when the stored fecha is another day', () => {
    expect(
      resolveCupoWhatsapp({
        storedFecha: '2026-09-16',
        storedCount: 22,
        today: '2026-09-17',
        contactosHoy: 4,
      }).enviados
    ).toBe(4);
  });
});

describe('nextCupoCount', () => {
  it('increments the stored count during the same day', () => {
    expect(
      nextCupoCount({
        storedFecha: '2026-09-17',
        storedCount: 8,
        today: '2026-09-17',
        contactosHoy: 3,
      })
    ).toBe(9);
  });

  it('starts from contactos of today plus this send on a new day', () => {
    expect(
      nextCupoCount({
        storedFecha: null,
        storedCount: 0,
        today: '2026-09-17',
        contactosHoy: 10,
      })
    ).toBe(11);
  });
});

describe('asDateOnly', () => {
  it('keeps YYYY-MM-DD and strips a datetime suffix', () => {
    expect(asDateOnly('2026-09-17')).toBe('2026-09-17');
    expect(asDateOnly('2026-09-17T00:00:00.000Z')).toBe('2026-09-17');
    expect(asDateOnly(new Date('2026-09-17T00:00:00.000Z'))).toBe('2026-09-17');
    expect(asDateOnly(null)).toBeNull();
  });
});
