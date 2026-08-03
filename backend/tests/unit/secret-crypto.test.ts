import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  hasMpTokenEncryptionKey,
  secretHint,
} from '../../src/utils/secret-crypto';

describe('secret-crypto (MP token)', () => {
  const key = 'a'.repeat(64);

  beforeAll(() => {
    process.env.MP_TOKEN_ENCRYPTION_KEY = key;
  });

  afterAll(() => {
    delete process.env.MP_TOKEN_ENCRYPTION_KEY;
  });

  it('roundtrip encrypt/decrypt', () => {
    const plain = 'TEST-abc-123-access-token-value';
    const enc = encryptSecret(plain);
    expect(enc.startsWith('v1:')).toBe(true);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it('hint shows last 4', () => {
    expect(secretHint('APP_USR-xxxx-1234')).toBe('…1234');
  });

  it('hasMpTokenEncryptionKey validates hex length', () => {
    expect(hasMpTokenEncryptionKey()).toBe(true);
    process.env.MP_TOKEN_ENCRYPTION_KEY = 'short';
    expect(hasMpTokenEncryptionKey()).toBe(false);
    process.env.MP_TOKEN_ENCRYPTION_KEY = key;
  });
});
