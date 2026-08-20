import { describe, it, expect } from 'vitest';
import { normalizeWhatsappDigits } from '../../src/utils/whatsapp';

describe('normalizeWhatsappDigits', () => {
  it('adds 549 to a 10-digit San Rafael number (Amelie / WhatsApp Web)', () => {
    expect(normalizeWhatsappDigits('2604225561')).toBe('5492604225561');
  });

  it('keeps an already international 549 number', () => {
    expect(normalizeWhatsappDigits('5492604225561')).toBe('5492604225561');
  });

  it('strips a leading 0 from local numbers', () => {
    expect(normalizeWhatsappDigits('02604225561')).toBe('5492604225561');
  });

  it('inserts the mobile 9 when the number is 54 + area + local', () => {
    expect(normalizeWhatsappDigits('542604225561')).toBe('5492604225561');
  });
});
