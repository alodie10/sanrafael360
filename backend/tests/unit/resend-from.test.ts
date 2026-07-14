import { describe, it, expect } from 'vitest';
import { resolveResendFromAddress } from '../../src/services/notification-service';

describe('resolveResendFromAddress', () => {
  it('wraps bare email', () => {
    expect(resolveResendFromAddress('no-reply@sanrafael360.com')).toBe(
      'San Rafael 360 <no-reply@sanrafael360.com>'
    );
  });

  it('keeps already formatted from', () => {
    expect(resolveResendFromAddress('San Rafael 360 <no-reply@sanrafael360.com>')).toBe(
      'San Rafael 360 <no-reply@sanrafael360.com>'
    );
  });

  it('defaults when empty', () => {
    expect(resolveResendFromAddress('')).toBe('San Rafael 360 <no-reply@sanrafael360.com>');
  });
});
