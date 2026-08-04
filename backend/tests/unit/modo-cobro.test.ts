import { describe, it, expect } from 'vitest';
import {
  normalizeModoCobro,
  resolveCheckoutMetodoPago,
  parseModoCobroInput,
} from '../../src/api/reserva/services/modo-cobro';

describe('modo-cobro', () => {
  it('default mp_requerido', () => {
    expect(normalizeModoCobro(null)).toBe('mp_requerido');
    expect(normalizeModoCobro('')).toBe('mp_requerido');
  });

  it('parse valida enum', () => {
    expect(parseModoCobroInput('solo_local')).toBe('solo_local');
    expect(() => parseModoCobroInput('otro')).toThrow(/modo_cobro/);
  });

  it('solo_local siempre local', () => {
    expect(resolveCheckoutMetodoPago('solo_local', 'mp')).toBe('local');
  });

  it('mp_requerido rechaza local', () => {
    expect(() => resolveCheckoutMetodoPago('mp_requerido', 'local')).toThrow(/Mercado Pago/);
    expect(resolveCheckoutMetodoPago('mp_requerido')).toBe('mp');
  });

  it('mp_o_local respeta elección', () => {
    expect(resolveCheckoutMetodoPago('mp_o_local', 'local')).toBe('local');
    expect(resolveCheckoutMetodoPago('mp_o_local', 'mp')).toBe('mp');
    expect(resolveCheckoutMetodoPago('mp_o_local')).toBe('mp');
  });
});
