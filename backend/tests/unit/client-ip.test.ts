import { describe, expect, it } from 'vitest';
import { clientIpFromHeaders } from '../../src/utils/client-ip';

describe('clientIpFromHeaders', () => {
  it('usa x-vercel-forwarded-for si existe', () => {
    expect(
      clientIpFromHeaders({
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
        'x-vercel-forwarded-for': '9.9.9.9',
      })
    ).toBe('9.9.9.9');
  });

  it('no usa el primer X-Forwarded-For (spoofable)', () => {
    expect(clientIpFromHeaders({ 'x-forwarded-for': '8.8.8.8, 10.0.0.1' })).toBe('10.0.0.1');
  });
});
