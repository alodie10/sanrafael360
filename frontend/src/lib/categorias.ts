import { cache } from "react";
import { fetchFromStrapi } from "@/lib/strapi";
import { canUseAlgoliaSearch } from "@/lib/search-config";
import { getCategoriaFromAlgoliaBySlug } from "@/lib/search-negocios";
import { Categoria } from "@/types/strapi";

export const CATEGORIAS_LIST_PATH =
  "categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100";

const CATEGORIAS_FETCH_OPTIONS: RequestInit = {
  next: { revalidate: 300 },
};

export const getCategorias = cache(async function getCategorias(
  options: RequestInit = {}
): Promise<Categoria[]> {
  try {
    const res = await fetchFromStrapi(CATEGORIAS_LIST_PATH, {
      ...CATEGORIAS_FETCH_OPTIONS,
      ...options,
    });
    return res.data || [];
  } catch {
    return [];
  }
});

async function fetchCategoriaFromStrapi(cmsSlug: string): Promise<Categoria | null> {
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options: RequestInit = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
    const res = await fetchFromStrapi(
      `categorias?filters[slug][$eq]=${cmsSlug}&fields[0]=nombre&fields[1]=descripcion&fields[2]=documentId&fields[3]=slug`,
      { ...CATEGORIAS_FETCH_OPTIONS, ...options }
    );
    return res.data?.[0] || null;
  } catch {
    return null;
  }
}

/** Strapi primero; Algolia si el backend no responde o la categoría no está en local. */
export const getCategoriaBySlug = cache(async function getCategoriaBySlug(
  cmsSlug: string
): Promise<Categoria | null> {
  const fromStrapi = await fetchCategoriaFromStrapi(cmsSlug);
  if (fromStrapi) return fromStrapi;
  if (!canUseAlgoliaSearch()) return null;
  return getCategoriaFromAlgoliaBySlug(cmsSlug);
});
