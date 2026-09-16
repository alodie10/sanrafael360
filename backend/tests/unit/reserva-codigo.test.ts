import { describe, expect, it } from 'vitest';
import { generateReservaCodigo } from '../../src/utils/reserva-codigo';

describe('generateReservaCodigo', () => {
  it('formato JD- + 6 chars del alfabeto seguro', () => {
    const codigo = generateReservaCodigo();
    expect(codigo).toMatch(/^JD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(generateReservaCodigo()).not.toBe(codigo);
  });
});
