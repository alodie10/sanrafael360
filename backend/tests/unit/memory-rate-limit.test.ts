import { describe, expect, it } from 'vitest';
import { hitMemoryRateLimit, __resetMemoryRateLimitForTests } from '../../src/utils/memory-rate-limit';

describe('hitMemoryRateLimit', () => {
  it('permite hasta max y después bloquea', () => {
    __resetMemoryRateLimitForTests();
    const now = 1_000_000;
    expect(hitMemoryRateLimit('k', 2, 60_000, now)).toBe(true);
    expect(hitMemoryRateLimit('k', 2, 60_000, now)).toBe(true);
    expect(hitMemoryRateLimit('k', 2, 60_000, now)).toBe(false);
    expect(hitMemoryRateLimit('k', 2, 60_000, now + 61_000)).toBe(true);
  });
});
