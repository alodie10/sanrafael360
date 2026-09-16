import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/utils/html-escape';
import {
  httpsUrlOrUndefined,
  isTripadvisorHostname,
  normalizeHttpUrl,
  parsePublicHttpsUrl,
  tryParseGoogleMapsUrl,
} from '../../src/utils/safe-url';
import {
  assertCanPublishListing,
  assertOwnsNegocio,
} from '../../src/utils/negocio-acl';
import { ForbiddenError } from '../../src/utils/errors';
import { sanitizePortalUpdatePayload } from '../../src/api/negocio/services/portal-update-sanitize';
import { reservaConfirmacionEmail } from '../../src/api/reserva/services/templates/reserva-email-templates';
import { getAdminClaimEmail } from '../../src/api/negocio/services/templates/email-templates';
import { serializeJsonLd } from '../../../frontend/src/lib/json-ld';
import {
  decideCloudinarySignAccess,
  normalizeCloudinaryFolder,
} from '../../../frontend/src/lib/cloudinary-sign.server';
import { toStrapiEqFilter } from '../../../frontend/src/lib/strapi-query';
import { safeHttpHref } from '../../../frontend/src/lib/safe-outbound-url';

describe('escapeHtml', () => {
  it('escapa markup de phishing', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });
});

describe('reserva / claim emails', () => {
  it('no interpola HTML crudo del cliente', () => {
    const mail = reservaConfirmacionEmail({
      clienteNombre: '<script>alert(1)</script>',
      comercioNombre: 'Local',
      recursoNombre: 'Mesa',
      cuando: 'hoy',
      codigo: 'JD-1',
      textoLlegada: '<b>hola</b>',
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');

    const claim = getAdminClaimEmail('Negocio', 'a@b.com', '<h1>phishing</h1>');
    expect(claim).not.toContain('<h1>phishing</h1>');
    expect(claim).toContain('&lt;h1&gt;phishing&lt;/h1&gt;');
  });
});

describe('safe-url', () => {
  it('rechaza javascript: y hosts privados', () => {
    expect(normalizeHttpUrl('javascript:alert(1)')).toEqual({ ok: false });
    expect(() => parsePublicHttpsUrl('https://127.0.0.1')).toThrow();
    expect(httpsUrlOrUndefined('javascript:alert(1)')).toBeUndefined();
    expect(httpsUrlOrUndefined('https://maps.google.com/')).toBe('https://maps.google.com/');
  });

  it('no trata un nombre con substring goo.gl como URL', () => {
    expect(tryParseGoogleMapsUrl('https://169.254.169.254/?maps.app.goo.gl')).toBeNull();
    expect(tryParseGoogleMapsUrl('La Delicia')).toBeNull();
    expect(tryParseGoogleMapsUrl('https://maps.app.goo.gl/abc')?.hostname).toBe('maps.app.goo.gl');
  });

  it('allowlist tripadvisor', () => {
    expect(isTripadvisorHostname('www.tripadvisor.com.ar')).toBe(true);
    expect(isTripadvisorHostname('evil.com')).toBe(false);
  });
});

describe('negocio ACL', () => {
  const owner = { id: 7, email: 'owner@x.com', role: { name: 'Authenticated' } };
  const negocio = { owner: { id: 7 }, estado_reclamo: 'pendiente' };

  it('bloquea portal-update si el reclamo no está aprobado', () => {
    expect(() => assertOwnsNegocio(owner, negocio)).not.toThrow();
    expect(() => assertCanPublishListing(owner, negocio)).toThrow(ForbiddenError);
    expect(() =>
      assertCanPublishListing(owner, { ...negocio, estado_reclamo: 'aprobado' })
    ).not.toThrow();
    expect(() =>
      assertCanPublishListing(owner, { ...negocio, estado_reclamo: 'ninguno' })
    ).not.toThrow();
  });
});

describe('portal-update sanitize', () => {
  it('rechaza javascript: en maps y google_reviews mass assignment', () => {
    expect(() =>
      sanitizePortalUpdatePayload({ google_maps_url: 'javascript:alert(1)' }, false)
    ).toThrow();

    const cleaned = sanitizePortalUpdatePayload(
      {
        website: 'https://ejemplo.com',
        google_reviews: [{ author_url: 'javascript:alert(1)' }],
        is_premium: true,
      },
      false
    );
    expect(cleaned.google_reviews).toBeUndefined();
    expect(cleaned.is_premium).toBeUndefined();
    expect(cleaned.website).toContain('https://ejemplo.com');
  });
});

describe('cloudinary folder', () => {
  it('allowlist y rechaza injection', () => {
    expect(normalizeCloudinaryFolder('sanrafael360_galeria')).toBe('sanrafael360_galeria');
    expect(() =>
      normalizeCloudinaryFolder('sanrafael360_galeria&overwrite=1&public_id=victim')
    ).toThrow();
  });

  it('avisos solo admin; galeria pide dueño si no es admin', () => {
    expect(
      decideCloudinarySignAccess({ folder: 'sanrafael360_avisos', isAdmin: true })
    ).toBe('allow');
    expect(
      decideCloudinarySignAccess({ folder: 'sanrafael360_avisos', isAdmin: false })
    ).toBe('forbid');
    expect(
      decideCloudinarySignAccess({ folder: 'sanrafael360_galeria', isAdmin: false })
    ).toBe('need_owner');
    expect(
      decideCloudinarySignAccess({ folder: 'sanrafael360_galeria', isAdmin: true })
    ).toBe('allow');
  });
});

describe('strapi slug filter', () => {
  it('encodea y rechaza query injection', () => {
    expect(toStrapiEqFilter('mi-local')).toBe('mi-local');
    expect(toStrapiEqFilter('foo&populate[pagos]=true')).toBeNull();
  });
});

describe('safeHttpHref', () => {
  it('bloquea javascript:', () => {
    expect(safeHttpHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpHref('https://www.google.com/maps')).toBe('https://www.google.com/maps');
  });
});

describe('serializeJsonLd', () => {
  it('escapa < para no romper el tag script', () => {
    const html = serializeJsonLd({ name: '</script><img src=x>' });
    expect(html).not.toContain('</script>');
    expect(html).toContain('\\u003c/script>');
  });
});
