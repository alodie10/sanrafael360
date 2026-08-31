import { describe, it, expect, vi } from 'vitest';
import { DiscoveryService } from '../../src/services/discovery-service';

// Mock playwright to avoid browser launch during unit tests
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn(),
          waitForSelector: vi.fn(),
          locator: vi.fn(),
          close: vi.fn(),
        }),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('DiscoveryService Unit Tests', () => {
  const service = new DiscoveryService();

  describe('sanitizeText', () => {
    it('should normalize common UTF-8 corrupted characters (Sábado)', () => {
      // Testing private method via type casting for unit validation
      const input = 'SÃ¡bado de Sol';
      const result = (service as any).sanitizeText(input);
      expect(result).toBe('Sábado de Sol');
    });

    it('should normalize Miércoles corruption', () => {
      const input = 'MiÃ©rcoles de lluvia';
      const result = (service as any).sanitizeText(input);
      expect(result).toBe('Miércoles de lluvia');
    });

    it('should remove "Ocultar horarios" text and clean whitespace', () => {
      const input = '  Lunes 09:00-18:00   Ocultar horarios de la semana   ';
      const result = (service as any).sanitizeText(input);
      expect(result).toBe('Lunes 09:00-18:00');
    });

    it('should handle nested spaces correctly', () => {
      const input = 'Texto    con    muchos    espacios';
      const result = (service as any).sanitizeText(input);
      expect(result).toBe('Texto con muchos espacios');
    });
  });

  describe('toDiscoveryData phone', () => {
    it('normalizes formatted Places phones into local digits for telefono and whatsapp', () => {
      const data = (service as any).toDiscoveryData({
        name: 'Amelie',
        formatted_phone_number: '0260 449-8128',
        formatted_address: 'San Rafael',
      });
      expect(data.telefono).toBe('2604498128');
      expect(data.whatsapp).toBe('2604498128');
    });
  });
});
