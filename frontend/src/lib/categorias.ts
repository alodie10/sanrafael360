import { fetchFromStrapi } from "@/lib/strapi";
import { Categoria } from "@/types/strapi";

export const CATEGORIAS_LIST_PATH =
  "categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100";

const CATEGORIAS_FETCH_OPTIONS: RequestInit = {
  next: { revalidate: 300 },
};

export async function getCategorias(
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
}
