import { describe, it, expect } from 'vitest';
import { resolveConfigCapabilities } from '../../src/api/reserva/services/config-access';

describe('config-access (D2)', () => {
  it('admin siempre edita config, token y operación', () => {
    const caps = resolveConfigCapabilities({ operado_por_plataforma: true }, { role: 'admin' });
    expect(caps).toEqual({
      can_edit_config: true,
      can_edit_mp_token: true,
      can_edit_operacion: true,
    });
  });

  it('owner con operado_por_plataforma no edita config', () => {
    const caps = resolveConfigCapabilities({ operado_por_plataforma: true }, { role: 'owner' });
    expect(caps.can_edit_config).toBe(false);
    expect(caps.can_edit_mp_token).toBe(false);
  });

  it('owner sin plataforma edita config pero no token', () => {
    const caps = resolveConfigCapabilities({ operado_por_plataforma: false }, { role: 'owner' });
    expect(caps.can_edit_config).toBe(true);
    expect(caps.can_edit_mp_token).toBe(false);
    expect(caps.can_edit_operacion).toBe(false);
  });

  it('null/undefined operado_por_plataforma = plataforma', () => {
    const caps = resolveConfigCapabilities({}, { role: 'owner' });
    expect(caps.can_edit_config).toBe(false);
  });
});
