import { describe, it, expect, afterEach } from 'vitest';
import { isComercioMpConfigured } from '../../src/api/reserva/services/mp-token';

describe('isComercioMpConfigured (E2)', () => {
  const prevGlobal = process.env.MP_ACCESS_TOKEN;
  const prevNamed = process.env.MP_ACCESS_TOKEN_JADITEK;

  afterEach(() => {
    if (prevGlobal === undefined) delete process.env.MP_ACCESS_TOKEN;
    else process.env.MP_ACCESS_TOKEN = prevGlobal;
    if (prevNamed === undefined) delete process.env.MP_ACCESS_TOKEN_JADITEK;
    else process.env.MP_ACCESS_TOKEN_JADITEK = prevNamed;
  });

  it('sin enc ni mp_token_env → false aunque exista MP_ACCESS_TOKEN global', () => {
    process.env.MP_ACCESS_TOKEN = 'APP_USR-global-should-not-count';
    expect(isComercioMpConfigured({})).toBe(false);
  });

  it('con mp_access_token_enc → true', () => {
    expect(isComercioMpConfigured({ mp_access_token_enc: 'cipher' })).toBe(true);
  });

  it('con mp_token_env nombrado y valor en process.env → true', () => {
    process.env.MP_ACCESS_TOKEN_JADITEK = 'APP_USR-jaditek-test-token';
    expect(
      isComercioMpConfigured({ mp_token_env: 'MP_ACCESS_TOKEN_JADITEK' })
    ).toBe(true);
  });

  it('con mp_token_env nombrado pero env vacío → false', () => {
    delete process.env.MP_ACCESS_TOKEN_JADITEK;
    expect(
      isComercioMpConfigured({ mp_token_env: 'MP_ACCESS_TOKEN_JADITEK' })
    ).toBe(false);
  });
});
