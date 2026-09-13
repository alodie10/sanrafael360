export type PremiumListing = {
  is_premium?: boolean;
  premium_valid_until?: string | Date | null;
  categoria?: unknown;
};

function foldLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categoryLabels(categoria: unknown): string[] {
  if (!categoria) return [];
  if (typeof categoria === 'string') return [categoria];
  if (typeof categoria !== 'object') return [];
  const row = categoria as { nombre?: string; slug?: string; parent?: unknown };
  return [
    ...(row.nombre ? [row.nombre] : []),
    ...(row.slug ? [row.slug] : []),
    ...categoryLabels(row.parent),
  ];
}

/** Rubro público que mantiene ficha aunque no pague premium. */
export function isTouristInterestCategory(negocio: { categoria?: unknown }): boolean {
  return categoryLabels(negocio.categoria).some(
    (label) => foldLabel(label) === 'interes turistico'
  );
}

export function isPremiumListingActive(
  negocio: PremiumListing,
  now: Date = new Date()
): boolean {
  if (!negocio.is_premium) return false;
  if (!negocio.premium_valid_until) return true;
  const until =
    negocio.premium_valid_until instanceof Date
      ? negocio.premium_valid_until
      : new Date(negocio.premium_valid_until);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() >= now.getTime();
}

export function showsPublicFicha(
  negocio: PremiumListing,
  now: Date = new Date()
): boolean {
  return isPremiumListingActive(negocio, now) || isTouristInterestCategory(negocio);
}

/** Fotos de Places solo se bajan a hosting si hay ficha pública. */
export function shouldDownloadPlacesPhotos(
  negocio: PremiumListing,
  now: Date = new Date()
): boolean {
  return showsPublicFicha(negocio, now);
}

/** Sin vigencia y fuera de Interés Turístico: se pueden borrar fotos de Cloudinary. */
export function neverBeenPremium(negocio: PremiumListing): boolean {
  if (isTouristInterestCategory(negocio)) return false;
  if (negocio.is_premium) return false;
  return !negocio.premium_valid_until;
}

/** Calcula is_premium y la fecha ISO normalizada para updateVigencia del portal admin. */
export function resolveVigenciaUpdate(premium_valid_until: string | null): {
  is_premium: boolean;
  validUntilISO: string | null;
} {
  const is_premium = premium_valid_until
    ? new Date(premium_valid_until) >= new Date(new Date().setHours(0, 0, 0, 0))
    : false;

  let validUntilISO: string | null = null;
  if (premium_valid_until) {
    const d = new Date(premium_valid_until);
    d.setHours(12, 0, 0, 0);
    validUntilISO = d.toISOString();
  }

  return { is_premium, validUntilISO };
}
