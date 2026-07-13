/**
 * En desarrollo, la home usa Strapi local por defecto (no Algolia).
 * Si Strapi no responde y hay keys de Algolia, HomeClient hace fallback automático.
 *
 * Override: NEXT_PUBLIC_USE_ALGOLIA_IN_DEV=true para usar Algolia siempre en local.
 */
export function canUseAlgoliaSearch(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID &&
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
  );
}

export function shouldUseStrapiSearchForHome(): boolean {
  if (process.env.NEXT_PUBLIC_USE_ALGOLIA_IN_DEV === "true") {
    return false;
  }
  return process.env.NODE_ENV === "development";
}
