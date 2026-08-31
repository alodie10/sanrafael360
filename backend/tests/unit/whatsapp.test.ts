import { describe, it, expect } from 'vitest';
import { normalizeLocalPhoneDigits, normalizeWhatsappDigits } from '../../src/utils/whatsapp';

describe('normalizeLocalPhoneDigits', () => {
  it('strips leading 0, spaces and dashes from a Places formatted number', () => {
    expect(normalizeLocalPhoneDigits('0260 449-8128')).toBe('2604498128');
  });

  it('strips AR country code from an international number', () => {
    expect(normalizeLocalPhoneDigits('+54 260 449-8128')).toBe('2604498128');
  });

  it('keeps an already local 10-digit number', () => {
    expect(normalizeLocalPhoneDigits('2604498128')).toBe('2604498128');
  });
});

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
