import { fetchFromStrapi } from "@/lib/strapi";
import { Categoria, Negocio } from "@/types/strapi";

export type HomeSearchParams = {
  query?: string;
  localidad?: string;
  categoryDocId?: string | null;
};

function buildNegociosSearchPath({ query, localidad, categoryDocId }: HomeSearchParams): string {
  const parts: string[] = [];

  const text = [query, localidad]
    .filter((v) => v && v !== "San Rafael, Mendoza")
    .join(" ")
    .trim();

  if (text) {
    parts.push(`filters[$or][0][nombre][$containsi]=${encodeURIComponent(text)}`);
    parts.push(`filters[$or][1][direccion][$containsi]=${encodeURIComponent(text)}`);
  }

  if (categoryDocId) {
    parts.push(`filters[categoria][documentId][$eq]=${encodeURIComponent(categoryDocId)}`);
  }

  const populate = [
    "populate[categoria][fields][0]=nombre",
    "populate[categoria][fields][1]=slug",
    "populate[logo][fields][0]=url",
    "populate[imagen_portada][fields][0]=url",
    "populate[atributos][fields][0]=nombre",
    "populate[atributos][fields][1]=tipo",
    "populate[owner][fields][0]=id",
    "populate[owner][fields][1]=documentId",
    "fields[0]=nombre",
    "fields[1]=slug",
    "fields[2]=direccion",
    "fields[3]=is_premium",
    "fields[4]=premium_valid_until",
    "fields[5]=price_range",
    "fields[6]=rating",
    "fields[7]=review_count",
    "fields[8]=google_rating",
    "fields[9]=google_review_count",
    "fields[10]=tripadvisor_rating",
    "fields[11]=tripadvisor_review_count",
    "fields[12]=latitud",
    "fields[13]=longitud",
  ].join("&");

  const filterQuery = parts.length ? `${parts.join("&")}&` : "";
  return `negocios?${filterQuery}${populate}&pagination[pageSize]=100&sort=nombre:asc`;
}

/** Búsqueda de comercios contra el Strapi configurado (local en dev). */
export async function searchNegociosFromStrapi(params: HomeSearchParams): Promise<Negocio[]> {
  const res = await fetchFromStrapi(buildNegociosSearchPath(params));
  return (res.data ?? []) as Negocio[];
}

function mapAlgoliaHit(hit: Record<string, unknown>): Negocio {
  return {
    documentId: hit.objectID as string,
    slug: hit.slug as string,
    nombre: hit.nombre as string,
    direccion: hit.direccion as string,
    is_premium: hit.is_premium as boolean,
    premium_valid_until: hit.premium_valid_until as string,
    categoria: hit.categoria ? ({ nombre: hit.categoria as string } as Categoria) : undefined,
    atributos: (hit.atributos_ui as Negocio["atributos"]) || [],
    price_range: hit.price_range as string,
    rating: hit.rating as number,
    review_count: hit.review_count as number,
    google_rating: hit.google_rating as number,
    google_review_count: hit.google_review_count as number,
    tripadvisor_rating: hit.tripadvisor_rating as number,
    tripadvisor_review_count: hit.tripadvisor_review_count as number,
    imagen_portada: hit.imagen_portada as Negocio["imagen_portada"],
    logo: hit.logo as Negocio["logo"],
    owner: hit.owner as Negocio["owner"],
    latitud: hit.latitud as number,
    longitud: hit.longitud as number,
    ofertas: (hit.ofertas as Negocio["ofertas"]) || [],
  };
}

/** Búsqueda vía Algolia (prod o fallback en dev si Strapi no responde). */
export async function searchNegociosFromAlgolia(
  params: HomeSearchParams & { categorias?: Categoria[] }
): Promise<Negocio[]> {
  const { algoliasearch } = await import("algoliasearch");
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
  );

  let fullQuery = `${params.query || ""} ${params.localidad || ""}`.trim();

  if (params.categoryDocId && params.categorias?.length) {
    const selectedCat = params.categorias.find((c) => c.documentId === params.categoryDocId);
    if (selectedCat) {
      fullQuery = `${fullQuery} ${selectedCat.nombre}`.trim();
    }
  }

  const { results } = await client.search({
    requests: [
      {
        indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
        query: fullQuery,
        hitsPerPage: 100,
      },
    ],
  });

  const hits = (results[0] as { hits?: Record<string, unknown>[] })?.hits || [];
  const sortedHits = hits.sort((a, b) => {
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;
    return 0;
  });

  return sortedHits.map(mapAlgoliaHit);
}
