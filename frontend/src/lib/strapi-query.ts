/** Slug o documentId seguro para interpolar en filtros Strapi. */
export function isSafePublicSlug(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value);
}

export function encodeStrapiEq(value: string): string {
  return encodeURIComponent(value);
}

export function toStrapiEqFilter(value: string): string | null {
  const trimmed = value.trim();
  if (!isSafePublicSlug(trimmed)) return null;
  return encodeStrapiEq(trimmed);
}
