import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from '../../src/api/cliente/services/unsubscribe-token';

describe('unsubscribe-token', () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unsubscribe';
    process.env.FRONTEND_URL = 'https://www.sanrafael360.com';
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it('round-trips token', () => {
    const token = createUnsubscribeToken('doc-123');
    expect(verifyUnsubscribeToken(token)).toBe('doc-123');
  });

  it('rejects tampered token', () => {
    const token = createUnsubscribeToken('doc-123');
    expect(verifyUnsubscribeToken(token + 'x')).toBeNull();
    expect(verifyUnsubscribeToken('doc-999.' + token.split('.')[1])).toBeNull();
  });

  it('builds frontend baja url', () => {
    const url = buildUnsubscribeUrl('doc-123');
    expect(url.startsWith('https://www.sanrafael360.com/baja?token=')).toBe(true);
    expect(url).toContain(encodeURIComponent(createUnsubscribeToken('doc-123')));
  });
});
