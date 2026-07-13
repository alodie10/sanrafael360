import { describe, it, expect } from 'vitest';
import { resolveVigenciaUpdate } from '../../src/utils/premium-vigencia';

describe('premium-vigencia utils', () => {
  it('marks premium inactive when date is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const result = resolveVigenciaUpdate(dateStr);
    expect(result.is_premium).toBe(false);
    expect(result.validUntilISO).not.toBeNull();
  });

  it('marks premium active when date is today or future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const result = resolveVigenciaUpdate(dateStr);
    expect(result.is_premium).toBe(true);
    expect(result.validUntilISO).not.toBeNull();
  });

  it('returns inactive when premium_valid_until is null', () => {
    const result = resolveVigenciaUpdate(null);
    expect(result.is_premium).toBe(false);
    expect(result.validUntilISO).toBeNull();
  });
});
