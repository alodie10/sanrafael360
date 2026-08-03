import { describe, it, expect, beforeAll } from 'vitest';
import { __test } from '../../src/api/reserva/services/mp-oauth';

describe('mp-oauth state (E4)', () => {
  beforeAll(() => {
    if (!process.env.MP_TOKEN_ENCRYPTION_KEY) {
      process.env.MP_TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);
    }
  });

  it('firma y verifica state', () => {
    const state = __test.signState({
      slug: 'jaditek',
      userId: 7,
      exp: Date.now() + 60_000,
      n: 'abc',
    });
    const parsed = __test.verifyState(state);
    expect(parsed.slug).toBe('jaditek');
    expect(parsed.userId).toBe(7);
  });

  it('rechaza state adulterado', () => {
    const state = __test.signState({
      slug: 'jaditek',
      userId: 1,
      exp: Date.now() + 60_000,
      n: 'x',
    });
    expect(() => __test.verifyState(state + 'x')).toThrow();
  });
});
