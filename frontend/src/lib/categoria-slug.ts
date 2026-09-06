/**
 * El CMS dejó Alojamientos con slug `categoria`. La URL pública es
 * /categoria/alojamientos; el lookup a Strapi sigue usando el slug real.
 */
const CMS_TO_PUBLIC: Record<string, string> = {
  categoria: "alojamientos",
};

const PUBLIC_TO_CMS: Record<string, string> = {
  alojamientos: "categoria",
};

export function toPublicCategoriaSlug(cmsSlug: string): string {
  return CMS_TO_PUBLIC[cmsSlug] ?? cmsSlug;
}

export function toCmsCategoriaSlug(publicOrCmsSlug: string): string {
  return PUBLIC_TO_CMS[publicOrCmsSlug] ?? publicOrCmsSlug;
}

export function isPlaceholderCategoriaSlug(slug: string): boolean {
  return /^categoria-\d+$/.test(slug);
}

export function categoriaHref(slug: string | undefined | null): string {
  if (!slug) return "/";
  return `/categoria/${toPublicCategoriaSlug(slug)}`;
}
