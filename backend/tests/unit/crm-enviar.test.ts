import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import {
  actividadConsumioCupo,
  actividadMailConsumioCupo,
  assertPuedeEnviarMail,
  assertPuedeEnviarWhatsapp,
  asuntoDeCampana,
  avisoMailSinUrl,
  avisoWhatsappSinUrl,
  buildMailtoUrl,
  normalizeCrmEmail,
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
        telefono: '2615550000',
      })
    ).not.toThrow();
  });

  it('refuses WhatsApp when the phone cannot open wa.me', () => {
    expect(() =>
      assertPuedeEnviarWhatsapp({
        negocio: { documentId: 'n1' },
        telefono: '',
      })
    ).toThrow(/teléfono/);
    expect(() =>
      assertPuedeEnviarWhatsapp({ nombre: 'Ana', telefono: 'sin-numero' }, 'agenda')
    ).toThrow(/teléfono/);
  });

  it('lets agenda tenants open WhatsApp without a listing', () => {
    expect(() =>
      assertPuedeEnviarWhatsapp({ nombre: 'Ana', telefono: '2615550000' }, 'agenda')
    ).not.toThrow();
    expect(() =>
      assertPuedeEnviarWhatsapp({ nombre: 'Ana', no_contactar: true }, 'agenda')
    ).toThrow(ValidationError);
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

  it('requires a listing before mail in guia mode', () => {
    expect(() => assertPuedeEnviarMail({ nombre: 'Taller', email: 'a@b.co' })).toThrow(ValidationError);
    expect(() =>
      assertPuedeEnviarMail({ negocio: { documentId: 'n1' }, email: 'a@b.co' })
    ).not.toThrow();
    expect(() => assertPuedeEnviarMail({ email: 'a@b.co' }, 'agenda')).not.toThrow();
    expect(() => assertPuedeEnviarMail({ no_contactar: true }, 'agenda')).toThrow(ValidationError);
  });

  it('builds a mailto with campaign subject and leaves invalid mail without quota', () => {
    const url = buildMailtoUrl(' Ana@Taller.com ', asuntoDeCampana('SR360'), 'Hola Ana');
    expect(url?.startsWith('mailto:ana@taller.com?')).toBe(true);
    expect(decodeURIComponent(url || '')).toContain('subject=SR360');
    expect(decodeURIComponent(url || '')).toContain('Hola Ana');
    expect(buildMailtoUrl('no-es-mail', 'SR360', 'Hola')).toBeNull();
    expect(normalizeCrmEmail('  Ana@Taller.com ')).toBe('ana@taller.com');
    expect(asuntoDeCampana('  ')).toBe('San Rafael 360');
    expect(avisoMailSinUrl(false)).toMatch(/Error/);
    expect(avisoMailSinUrl(true)).toBeUndefined();
    expect(actividadMailConsumioCupo('Hola')).toBe(true);
    expect(actividadMailConsumioCupo('Mail no enviado: email inválido. Hola')).toBe(false);
    expect(patchTrasWhatsapp('nuevo', true)).toEqual({ en_cola: false, estado: 'contactado' });
  });
});
