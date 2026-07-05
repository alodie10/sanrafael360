/**
 * En desarrollo, la home usa Strapi local por defecto (no Algolia).
 * Así solo aparecen negocios que existen en tu SQLite/Postgres local.
 *
 * Override: NEXT_PUBLIC_USE_ALGOLIA_IN_DEV=true para probar Algolia en local.
 */
export function shouldUseStrapiSearchForHome(): boolean {
  if (process.env.NEXT_PUBLIC_USE_ALGOLIA_IN_DEV === 'true') {
    return false;
  }
  return process.env.NODE_ENV === 'development';
}
