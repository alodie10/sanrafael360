import { describe, expect, it } from 'vitest';
import { greetingForHour, greetingNow, hourInTimeZone } from '../../src/utils/prospeccion-saludo';
import { composeFichaMensaje } from '../../src/api/prospeccion/plantilla-defaults';

describe('greetingForHour', () => {
  it('returns Buen día from 6 through 11', () => {
    expect(greetingForHour(6)).toBe('¡Buen día!');
    expect(greetingForHour(11)).toBe('¡Buen día!');
  });

  it('returns Buenas tardes from 12 through 19', () => {
    expect(greetingForHour(12)).toBe('¡Buenas tardes!');
    expect(greetingForHour(19)).toBe('¡Buenas tardes!');
  });

  it('returns Buenas noches from 20 through 5', () => {
    expect(greetingForHour(20)).toBe('¡Buenas noches!');
    expect(greetingForHour(23)).toBe('¡Buenas noches!');
    expect(greetingForHour(0)).toBe('¡Buenas noches!');
    expect(greetingForHour(5)).toBe('¡Buenas noches!');
  });
});

describe('greetingNow in America/Argentina/Mendoza', () => {
  it('maps 09:00 ART to Buen día', () => {
    const now = new Date('2026-08-31T12:00:00.000Z');
    expect(hourInTimeZone(now)).toBe(9);
    expect(greetingNow(now)).toBe('¡Buen día!');
  });

  it('maps 18:00 ART to Buenas tardes', () => {
    const now = new Date('2026-08-31T21:00:00.000Z');
    expect(hourInTimeZone(now)).toBe(18);
    expect(greetingNow(now)).toBe('¡Buenas tardes!');
  });

  it('maps 22:00 ART to Buenas noches', () => {
    const now = new Date('2026-09-01T01:00:00.000Z');
    expect(hourInTimeZone(now)).toBe(22);
    expect(greetingNow(now)).toBe('¡Buenas noches!');
  });
});

describe('composeFichaMensaje', () => {
  it('joins url, caption, pitch and signature with blank lines', () => {
    expect(
      composeFichaMensaje({
        url: 'https://www.sanrafael360.com/negocios/jc',
        texto_ficha: '¡Mirá este comercio en San Rafael 360!',
        mensaje: 'Oferta premium',
        firma: 'Diego Alonso',
      })
    ).toBe(
      [
        'https://www.sanrafael360.com/negocios/jc',
        '¡Mirá este comercio en San Rafael 360!',
        'Oferta premium',
        'Diego Alonso',
      ].join('\n\n')
    );
  });
});
