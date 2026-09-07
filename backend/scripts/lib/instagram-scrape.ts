import {
  canonicalInstagramUrl,
  extractInstagramHandlesFromText,
  normalizeInstagramUsername,
} from '../../src/utils/instagram';

export type IgConfidence = 'high' | 'medium' | 'low';
export type IgSource =
  | 'existing'
  | 'field_website'
  | 'field_facebook'
  | 'website_html'
  | 'search';

export type NegocioRow = {
  documentId: string;
  nombre: string;
  slug: string;
  categoria: string | null;
  instagram: string | null;
  website: string | null;
  facebook: string | null;
};

export type IgCandidate = {
  username: string;
  source: IgSource;
  score: number;
};

export type IgResult = NegocioRow & {
  username: string | null;
  instagramUrl: string | null;
  source: IgSource | null;
  confidence: IgConfidence | null;
  score: number;
  candidates: IgCandidate[];
  notes: string[];
};

const USER_AGENT =
  'Mozilla/5.0 (compatible; SR360-IG-Enrichment/1.0; +https://www.sanrafael360.com)';

const SKIP_HOST_RE =
  /(^|\.)(facebook|fb|instagram|instagr\.am|twitter|x|tiktok|youtube|whatsapp|wa\.me|booking|tripadvisor|airbnb|expedia|hotels|google|maps\.google|mercadolibre|mercadopago|linktr\.ee|vio\.com|deals\.vio)\./i;

const STOPWORDS = new Set([
  'hotel',
  'hoteles',
  'cabana',
  'cabanas',
  'san',
  'rafael',
  'valle',
  'grande',
  'posada',
  'complejo',
  'apart',
  'spa',
  'restaurant',
  'restaurante',
  'the',
  'and',
  'del',
  'las',
  'los',
  'de',
  'la',
  'el',
  'sucursal',
  'ciudad',
  'bar',
  'cafe',
  'bodega',
  'turismo',
  'viajes',
  'evt',
  'local',
  'centro',
  'mendoza',
  'argentina',
  'www',
  'com',
  'alojamiento',
]);

export function flattenNegocio(raw: Record<string, any>): NegocioRow | null {
  const a = raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : raw;
  const documentId = String(raw.documentId || a.documentId || '');
  const nombre = String(a.nombre || '').trim();
  if (!documentId || !nombre) return null;
  const cat = a.categoria?.nombre || a.categoria?.data?.attributes?.nombre || null;
  return {
    documentId,
    nombre,
    slug: String(a.slug || ''),
    categoria: cat ? String(cat) : null,
    instagram: a.instagram ? String(a.instagram) : null,
    website: a.website ? String(a.website) : null,
    facebook: a.facebook ? String(a.facebook) : null,
  };
}

export function tokenizeName(nombre: string): string[] {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export function scoreHandle(nombre: string, username: string): number {
  const tokens = tokenizeName(nombre);
  const compact = username.replace(/[._]/g, '');
  if (!tokens.length) return 0.2;
  const hits = tokens.filter((t) => compact.includes(t) || username.includes(t));
  const ratio = hits.length / tokens.length;
  const longHit = hits.some((t) => t.length >= 5);
  return Math.min(1, ratio + (longHit ? 0.25 : 0));
}

export function confidenceFor(source: IgSource, score: number): IgConfidence {
  if (source === 'existing') return 'high';
  if (source === 'search') {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }
  if (score >= 0.35) return 'high';
  if (score >= 0.15) return 'medium';
  return 'low';
}

export function pickBest(nombre: string, candidates: IgCandidate[]): IgCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => b.score - a.score)[0];
}

export function candidatesFromFields(row: NegocioRow): IgCandidate[] {
  const out: IgCandidate[] = [];
  const push = (raw: string | null, source: IgSource) => {
    const handles = extractInstagramHandlesFromText(raw || '');
    const fallback = handles.length ? handles : [normalizeInstagramUsername(raw)].filter(Boolean);
    for (const username of fallback as string[]) {
      if (!username) continue;
      out.push({ username, source, score: scoreHandle(row.nombre, username) });
    }
  };
  push(row.instagram, 'existing');
  push(row.website, 'field_website');
  push(row.facebook, 'field_facebook');
  return dedupeCandidates(out);
}

export function dedupeCandidates(candidates: IgCandidate[]): IgCandidate[] {
  const best = new Map<string, IgCandidate>();
  for (const item of candidates) {
    const prev = best.get(item.username);
    if (!prev || item.score > prev.score) best.set(item.username, item);
  }
  return [...best.values()];
}

export function isSkippableWebsite(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SKIP_HOST_RE.test(`${host}.`);
  } catch {
    return true;
  }
}

export async function fetchHtml(url: string, timeoutMs = 12000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !/html|xml|text/i.test(type || 'text/html')) return null;
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > 900_000 ? buf.slice(0, 900_000) : buf;
    return new TextDecoder('utf-8', { fatal: false }).decode(slice);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeWebsiteHandles(website: string): Promise<string[]> {
  if (!website || isSkippableWebsite(website)) return [];
  const html = await fetchHtml(website);
  const fromHome = html ? extractInstagramHandlesFromText(html) : [];
  if (fromHome.length) return fromHome;
  const base = website.replace(/\/+$/, '');
  for (const path of ['/contacto', '/contact', '/nosotros']) {
    const extra = await fetchHtml(`${base}${path}`);
    const found = extra ? extractInstagramHandlesFromText(extra) : [];
    if (found.length) return found;
  }
  return [];
}

export async function searchInstagramHandles(nombre: string): Promise<string[]> {
  const q = `site:instagram.com "${nombre}" San Rafael Mendoza`;
  const body = new URLSearchParams({ q });
  const html = await fetchHtmlPost('https://html.duckduckgo.com/html/', body);
  if (!html) return [];
  return extractInstagramHandlesFromText(html);
}

async function fetchHtmlPost(url: string, body: URLSearchParams): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function toResult(row: NegocioRow, candidates: IgCandidate[], notes: string[]): IgResult {
  const best = pickBest(row.nombre, candidates);
  return {
    ...row,
    username: best?.username || null,
    instagramUrl: best ? canonicalInstagramUrl(best.username) : null,
    source: best?.source || null,
    confidence: best ? confidenceFor(best.source, best.score) : null,
    score: best?.score || 0,
    candidates,
    notes,
  };
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}
