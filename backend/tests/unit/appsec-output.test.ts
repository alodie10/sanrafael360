import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../../../frontend/src/lib/json-ld';
import {
  isPrivateOrLocalIp,
  parsePublicHttpsUrl,
} from '../../../frontend/src/lib/safe-outbound-url';

describe('serializeJsonLd', () => {
  it('escapa < para no romper el tag script', () => {
    const html = serializeJsonLd({ name: '</script><img src=x>' });
    expect(html).not.toContain('</script>');
    expect(html).toContain('\\u003c/script>');
  });
});

describe('parsePublicHttpsUrl', () => {
  it('acepta https público', () => {
    expect(parsePublicHttpsUrl('https://www.facebook.com').hostname).toBe('www.facebook.com');
  });

  it('rechaza http, localhost e IPs privadas', () => {
    expect(() => parsePublicHttpsUrl('http://www.ejemplo.com')).toThrow();
    expect(() => parsePublicHttpsUrl('https://localhost')).toThrow();
    expect(() => parsePublicHttpsUrl('https://127.0.0.1')).toThrow();
    expect(() => parsePublicHttpsUrl('https://192.168.0.1')).toThrow();
    expect(() => parsePublicHttpsUrl('https://169.254.169.254')).toThrow();
  });
});

describe('isPrivateOrLocalIp', () => {
  it('marca loopback y RFC1918', () => {
    expect(isPrivateOrLocalIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('172.16.5.1')).toBe(true);
    expect(isPrivateOrLocalIp('8.8.8.8')).toBe(false);
  });
});
