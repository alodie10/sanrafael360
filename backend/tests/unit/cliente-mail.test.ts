import { describe, it, expect } from 'vitest';
import {
  filterBroadcastRecipients,
  normalizeClienteEmail,
} from '../../src/api/cliente/services/cliente-mail-audience';
import { wrapClienteAvisosEmail } from '../../src/api/cliente/services/templates/cliente-email-templates';

describe('cliente mail audience', () => {
  const sample = [
    { documentId: 'a', email: 'a@x.com', opt_out: false },
    { documentId: 'b', email: 'b@x.com', opt_out: true },
    { documentId: 'c', email: 'c@x.com', opt_out: false },
  ];

  it('normalizes email', () => {
    expect(normalizeClienteEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });

  it('excludes opt_out on audience=all', () => {
    const recipients = filterBroadcastRecipients(sample, { audience: 'all' });
    expect(recipients.map((r) => r.documentId)).toEqual(['a', 'c']);
  });

  it('filters selected and still respects opt_out', () => {
    const recipients = filterBroadcastRecipients(sample, {
      audience: 'selected',
      documentIds: ['b', 'c'],
    });
    expect(recipients.map((r) => r.documentId)).toEqual(['c']);
  });

  it('throws when selected audience has empty ids', () => {
    expect(() =>
      filterBroadcastRecipients(sample, { audience: 'selected', documentIds: [] })
    ).toThrow(/al menos un cliente/i);
  });
});

describe('wrapClienteAvisosEmail', () => {
  it('marks test mails', () => {
    const html = wrapClienteAvisosEmail('<p>hola</p>', { isTest: true });
    expect(html).toContain('MAIL DE PRUEBA');
    expect(html).toContain('hola');
    expect(html).toContain('San Rafael 360');
  });

  it('omits test banner on broadcast', () => {
    const html = wrapClienteAvisosEmail('<p>novedad</p>', { isTest: false });
    expect(html).not.toContain('MAIL DE PRUEBA');
    expect(html).toContain('novedad');
  });

  it('includes unsubscribe link when provided', () => {
    const html = wrapClienteAvisosEmail('<p>x</p>', {
      unsubscribeUrl: 'https://www.sanrafael360.com/baja?token=abc',
    });
    expect(html).toContain('darte de baja con un clic');
    expect(html).toContain('https://www.sanrafael360.com/baja?token=abc');
  });
});
