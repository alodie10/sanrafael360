import { lookup } from 'node:dns/promises';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

const GOOGLE_MAPS_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
]);

function ipv4ToInt(host: string): number | null {
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

export function isPrivateOrLocalIp(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h.includes(':')) {
    if (h === '::1' || h === '::' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) {
      return true;
    }
  }
  const mapped = h.startsWith('::ffff:') ? h.slice(7) : h;
  const ip = ipv4ToInt(mapped);
  if (ip === null) return false;
  const a = ip >>> 24;
  const b = (ip >>> 16) & 255;
  if (a === 0 || a === 10 || a === 127 || a === 224 || a >= 240) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function parsePublicHttpsUrl(raw: string): URL {
  const href = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const url = new URL(href);
  if (url.protocol !== 'https:') {
    throw new Error('Only https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new Error('Invalid URL');
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Host not allowed');
  }
  if (!host.includes('.')) {
    throw new Error('Host not allowed');
  }
  if (isPrivateOrLocalIp(host)) {
    throw new Error('Host not allowed');
  }
  return url;
}

export async function assertResolvedPublicHost(url: URL): Promise<void> {
  const resolved = await lookup(url.hostname, { all: true });
  if (resolved.some((r) => isPrivateOrLocalIp(r.address))) {
    throw new Error('Host not allowed');
  }
}

/** http(s) para hrefs de ficha. Rechaza javascript:, data:, etc. */
export function normalizeHttpUrl(raw: unknown): { ok: true; url: string | null } | { ok: false } {
  if (raw == null || raw === '') return { ok: true, url: null };
  let value = String(raw).trim();
  if (!value) return { ok: true, url: null };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:/i.test(value)) return { ok: false };
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false };
    return { ok: true, url: parsed.href };
  } catch {
    return { ok: false };
  }
}

export function httpsUrlOrUndefined(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function isTripadvisorHostname(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === 'tripadvisor.com' ||
    h.endsWith('.tripadvisor.com') ||
    h === 'tripadvisor.com.ar' ||
    h.endsWith('.tripadvisor.com.ar')
  );
}

export function isGoogleMapsHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (GOOGLE_MAPS_HOSTS.has(h)) return true;
  return h.endsWith('.google.com') || h.endsWith('.google.com.ar') || h === 'google.com.ar';
}

/** Solo acepta URL absoluta de hosts Google Maps; no trata un nombre de negocio como URL. */
export function tryParseGoogleMapsUrl(input: string): URL | null {
  const trimmed = String(input || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!isGoogleMapsHostname(url.hostname)) return null;
    if (url.username || url.password) return null;
    if (isPrivateOrLocalIp(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
