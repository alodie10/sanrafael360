import { describe, it, expect } from 'vitest';
import { applySimulacionGate, willMpBeConfigured } from '../../src/api/reserva/services/sim-gate';

describe('sim-gate (E2)', () => {
  it('sin token no está configurado', () => {
    expect(willMpBeConfigured({}, {})).toBe(false);
  });

  it('token cifrado cuenta como configurado', () => {
    expect(willMpBeConfigured({ mp_access_token_enc: 'enc' }, {})).toBe(true);
  });

  it('pegar token en el body proyecta configurado', () => {
    expect(
      willMpBeConfigured({}, { mp_access_token: 'APP_USR-12345678901234567890' })
    ).toBe(true);
  });

  it('clear token deja de estar configurado si no hay env', () => {
    expect(
      willMpBeConfigured(
        { mp_access_token_enc: 'enc' },
        { mp_access_token_clear: true }
      )
    ).toBe(false);
  });

  it('rechaza apagar simulación sin token', () => {
    const patch: Record<string, unknown> = { modo_simulacion: false };
    expect(() => applySimulacionGate({}, { modo_simulacion: false }, patch)).toThrow(
      /simulación/i
    );
  });

  it('fuerza simulación ON al limpiar token', () => {
    const patch: Record<string, unknown> = {};
    applySimulacionGate(
      { mp_access_token_enc: 'enc', modo_simulacion: false },
      { mp_access_token_clear: true },
      patch
    );
    expect(patch.modo_simulacion).toBe(true);
  });

  it('permite apagar simulación si hay token', () => {
    const patch: Record<string, unknown> = { modo_simulacion: false };
    applySimulacionGate(
      { mp_access_token_enc: 'enc' },
      { modo_simulacion: false },
      patch
    );
    expect(patch.modo_simulacion).toBe(false);
  });

  it('permite apagar simulación en el mismo save que pega token', () => {
    const patch: Record<string, unknown> = { modo_simulacion: false };
    applySimulacionGate(
      {},
      { modo_simulacion: false, mp_access_token: 'APP_USR-12345678901234567890' },
      patch
    );
    expect(patch.modo_simulacion).toBe(false);
  });
});
