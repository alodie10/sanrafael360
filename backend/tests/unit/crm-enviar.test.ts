import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import {
  actividadConsumioCupo,
  assertPuedeEnviarWhatsapp,
  avisoWhatsappSinUrl,
  patchTrasWhatsapp,
} from '../../src/api/crm/crm-enviar';

describe('crm-enviar', () => {
  it('requires a listing before WhatsApp', () => {
    expect(() =>
      assertPuedeEnviarWhatsapp({ nombre: 'Taller', telefono: '2615550000' })
    ).toThrow(ValidationError);
    expect(() =>
      assertPuedeEnviarWhatsapp({
        negocio: { documentId: 'n1', slug: 'taller' },
        no_contactar: false,
      })
    ).not.toThrow();
  });

  it('leaves the queue even when WhatsApp has no URL', () => {
    expect(patchTrasWhatsapp('nuevo', false)).toEqual({ en_cola: false });
    expect(patchTrasWhatsapp('nuevo', true)).toEqual({ en_cola: false, estado: 'contactado' });
    expect(avisoWhatsappSinUrl(false)).toMatch(/Error WSP/);
    expect(avisoWhatsappSinUrl(true)).toBeUndefined();
  });

  it('does not consume quota when the phone never opened WhatsApp', () => {
    expect(actividadConsumioCupo('Hola Diego')).toBe(true);
    expect(actividadConsumioCupo('WhatsApp no enviado: teléfono inválido. Hola')).toBe(false);
  });
});
