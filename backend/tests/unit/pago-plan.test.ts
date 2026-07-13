import { describe, it, expect } from 'vitest';
import { isSemestralPlan, resolvePremiumDays } from '../../src/utils/pago-plan';

describe('pago-plan utils', () => {
  describe('isSemestralPlan', () => {
    it('returns true when monto meets semestral threshold', () => {
      expect(isSemestralPlan(50000, 50000)).toBe(true);
      expect(isSemestralPlan(75000, 50000)).toBe(true);
    });

    it('returns false for mensual monto or missing monto', () => {
      expect(isSemestralPlan(1200, 50000)).toBe(false);
      expect(isSemestralPlan(null, 50000)).toBe(false);
      expect(isSemestralPlan(undefined, 50000)).toBe(false);
    });
  });

  describe('resolvePremiumDays', () => {
    it('returns semestral days when plan is semestral', () => {
      expect(resolvePremiumDays(true, 180, 30)).toBe(180);
    });

    it('returns mensual days when plan is mensual', () => {
      expect(resolvePremiumDays(false, 180, 30)).toBe(30);
    });
  });
});
