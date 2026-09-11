export type EfemerideVigencia = {
  vigente_desde?: string | Date | null;
  vigente_hasta?: string | Date | null;
};

export type OfertaVigencia = {
  activa?: boolean;
  valida_desde?: string | Date | null;
  valida_hasta?: string | Date | null;
};

export type PremiumVigencia = {
  is_premium?: boolean;
  premium_valid_until?: string | Date | null;
};

export type EfemerideTipo = 'efemeride' | 'feria';

export type ParticipanteExterno = {
  nombre: string;
  url: string | null;
};

export type PublicItemKind = 'oferta' | 'negocio';

export type PublicItem = {
  kind: PublicItemKind;
  negocio: Record<string, unknown>;
  oferta?: Record<string, unknown>;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isEfemerideVigente(efemeride: EfemerideVigencia, now: Date = new Date()): boolean {
  const desde = toDate(efemeride.vigente_desde);
  const hasta = toDate(efemeride.vigente_hasta);
  if (desde && ahoraEsAntes(now, desde)) return false;
  if (hasta && now.getTime() > hasta.getTime()) return false;
  return true;
}

function ahoraEsAntes(now: Date, desde: Date): boolean {
  return now.getTime() < desde.getTime();
}

export function isOfertaVigente(oferta: OfertaVigencia, now: Date = new Date()): boolean {
  if (oferta.activa !== true) return false;
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (desde && ahoraEsAntes(now, desde)) return false;
  if (hasta && now.getTime() > hasta.getTime()) return false;
  return true;
}

export function isPremiumActivo(negocio: PremiumVigencia, now: Date = new Date()): boolean {
  if (!negocio.is_premium) return false;
  const until = toDate(negocio.premium_valid_until);
  if (!until) return true;
  return until.getTime() >= now.getTime();
}

export function formatParticipanteLabel(nombre: string, categoriaNombre?: string | null): string {
  const name = (nombre || '').trim();
  const categoria = (categoriaNombre || '').trim();
  if (!categoria) return name;
  return `${name} — ${categoria}`;
}

export function compareByNombreEs(a: string, b: string): number {
  return (a || '').localeCompare(b || '', 'es', { sensitivity: 'base' });
}

export function slugifyNombre(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function normalizeTipo(value: unknown): EfemerideTipo {
  return value === 'feria' ? 'feria' : 'efemeride';
}

export function isEfemerideTipo(value: unknown): value is EfemerideTipo {
  return value === 'efemeride' || value === 'feria';
}

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

export function sanitizeParticipantesExternos(
  value: unknown
): { ok: true; items: ParticipanteExterno[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: 'participantes_externos debe ser un array' };
  }

  const items: ParticipanteExterno[] = [];
  for (const raw of value) {
    const nombre = String((raw as any)?.nombre ?? '').trim().slice(0, 200);
    if (!nombre) continue;
    const urlRes = normalizeHttpUrl((raw as any)?.url);
    if (!urlRes.ok) {
      return { ok: false, message: `URL inválida para "${nombre}"` };
    }
    items.push({ nombre, url: urlRes.url });
  }
  return { ok: true, items };
}

export function mapParticipantesExternos(rows: unknown): ParticipanteExterno[] {
  const result = sanitizeParticipantesExternos(Array.isArray(rows) ? rows : []);
  return result.ok ? result.items : [];
}

export function countParticipantes(row: {
  tipo?: unknown;
  negocios?: unknown;
  participantes_externos?: unknown;
}): number {
  if (normalizeTipo(row.tipo) === 'feria') {
    return mapParticipantesExternos(row.participantes_externos).length;
  }
  return Array.isArray(row.negocios) ? row.negocios.length : 0;
}

export function buildPublicItems(
  negocios: Array<Record<string, any>>,
  now: Date = new Date()
): PublicItem[] {
  const sorted = [...negocios].sort((a, b) => compareByNombreEs(a?.nombre, b?.nombre));
  const items: PublicItem[] = [];

  for (const negocio of sorted) {
    const ofertas = Array.isArray(negocio.ofertas) ? negocio.ofertas : [];
    const vigentes = ofertas.filter((oferta) => isOfertaVigente(oferta, now));
    if (vigentes.length > 0) {
      for (const oferta of vigentes) {
        items.push({
          kind: 'oferta',
          negocio,
          oferta: { ...oferta, negocio },
        });
      }
      continue;
    }
    items.push({ kind: 'negocio', negocio });
  }

  return items;
}
