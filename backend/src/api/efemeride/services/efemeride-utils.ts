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
