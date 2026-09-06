import { cache } from "react";
import { fetchFromStrapi, isStrapiUnreachableError } from "@/lib/strapi";
import { canUseAlgoliaSearch, shouldUseStrapiSearchForHome } from "@/lib/search-config";
import { Categoria, Negocio } from "@/types/strapi";
import { matchFieldFromAlgoliaHit, matchFieldFromText, queryVariants } from "@/lib/search-match";
import { uniqueNegocios } from "@/lib/unique-negocios";

export type HomeSearchParams = {
  query?: string;
  localidad?: string;
  categoryDocId?: string | null;
};

const HOME_NEGOCIOS_FETCH_OPTIONS: RequestInit = {
  next: { revalidate: 60 },
};

const STRAPI_TEXT_PATHS = [
  "[nombre][$containsi]",
  "[atributos][nombre][$containsi]",
  "[descripcion][$containsi]",
  "[categoria][nombre][$containsi]",
  "[categoria][palabras_clave][$containsi]",
];

const ALGOLIA_SEARCHABLE = [
  "nombre",
  "categoria",
  "search_keywords",
  "atributos",
  "descripcion",
];

const NEGOCIO_SEARCH_POPULATE = [
  "populate[categoria][fields][0]=nombre",
  "populate[categoria][fields][1]=slug",
  "populate[categoria][fields][2]=palabras_clave",
  "populate[logo][fields][0]=url",
  "populate[imagen_portada][fields][0]=url",
  "populate[atributos][fields][0]=nombre",
  "populate[atributos][fields][1]=tipo",
  "populate[owner][fields][0]=id",
  "populate[owner][fields][1]=documentId",
  "fields[0]=nombre",
  "fields[1]=slug",
  "fields[2]=direccion",
  "fields[3]=descripcion",
  "fields[4]=is_premium",
  "fields[5]=premium_valid_until",
  "fields[6]=price_range",
  "fields[7]=rating",
  "fields[8]=review_count",
  "fields[9]=google_rating",
  "fields[10]=google_review_count",
  "fields[11]=tripadvisor_rating",
  "fields[12]=tripadvisor_review_count",
  "fields[13]=latitud",
  "fields[14]=longitud",
  "fields[15]=reserva_url",
  "fields[16]=reserva_habilitada",
  "fields[17]=cta_link",
  "fields[18]=cta_habilitado",
].join("&");

function buildNegociosSearchPath({ query, localidad, categoryDocId }: HomeSearchParams): string {
  const parts: string[] = [];
  const text = [query, localidad]
    .filter((v) => v && v !== "San Rafael, Mendoza")
    .join(" ")
    .trim();

  let orIndex = 0;
  for (const term of queryVariants(text)) {
    for (const path of STRAPI_TEXT_PATHS) {
      parts.push(`filters[$or][${orIndex}]${path}=${encodeURIComponent(term)}`);
      orIndex += 1;
    }
  }

  if (categoryDocId) {
    parts.push(`filters[categoria][documentId][$eq]=${encodeURIComponent(categoryDocId)}`);
  }

  const filterQuery = parts.length ? `${parts.join("&")}&` : "";
  return `negocios?${filterQuery}${NEGOCIO_SEARCH_POPULATE}&pagination[pageSize]=100&sort=nombre:asc`;
}

/** Búsqueda de comercios contra el Strapi configurado (local en dev). */
export async function searchNegociosFromStrapi(
  params: HomeSearchParams,
  options: RequestInit = {}
): Promise<Negocio[]> {
  const res = await fetchFromStrapi(buildNegociosSearchPath(params), options);
  const query = params.query?.trim() || "";
  return uniqueNegocios(
    ((res.data ?? []) as Negocio[]).map((negocio) => ({
      ...negocio,
      searchMatch: query ? matchFieldFromText(negocio, query) : undefined,
    }))
  );
}

/**
 * Carga inicial de la home (Server Component).
 * Dev: Strapi local con fallback Algolia. Prod: Algolia.
 */
export const getHomeNegocios = cache(async function getHomeNegocios(
  params: HomeSearchParams & { categorias?: Categoria[] } = {}
): Promise<Negocio[]> {
  try {
    if (shouldUseStrapiSearchForHome()) {
      try {
        return await searchNegociosFromStrapi(params, HOME_NEGOCIOS_FETCH_OPTIONS);
      } catch (error) {
        if (!isStrapiUnreachableError(error) || !canUseAlgoliaSearch()) {
          return [];
        }
      }
    }

    if (canUseAlgoliaSearch()) {
      return await searchNegociosFromAlgolia(params);
    }

    return [];
  } catch {
    return [];
  }
});

function mapAlgoliaHit(hit: Record<string, unknown>, query?: string): Negocio {
  const mapped: Negocio = {
    id: typeof hit.id === "number" ? hit.id : 0,
    documentId: hit.objectID as string,
    slug: hit.slug as string,
    nombre: hit.nombre as string,
    descripcion: hit.descripcion as string | undefined,
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
    reserva_url: hit.reserva_url as string | undefined,
    reserva_habilitada: hit.reserva_habilitada as boolean | undefined,
    cta_link: hit.cta_link as string | undefined,
    cta_habilitado: hit.cta_habilitado as boolean | undefined,
  };
  mapped.searchMatch = query ? matchFieldFromAlgoliaHit(hit, query) : undefined;
  return mapped;
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

  const textQuery = (params.query || "").trim();
  let query = textQuery;

  if (!query && params.categoryDocId && params.categorias?.length) {
    const selectedCat = params.categorias.find((c) => c.documentId === params.categoryDocId);
    if (selectedCat) query = selectedCat.nombre;
  }

  const { results } = await client.search({
    requests: [
      {
        indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
        query,
        hitsPerPage: 100,
        restrictSearchableAttributes: [...ALGOLIA_SEARCHABLE],
        attributesToHighlight: [...ALGOLIA_SEARCHABLE],
        removeStopWords: true,
        ignorePlurals: true,
        removeWordsIfNoResults: "firstWords",
      },
    ],
  });

  const hits = (results[0] as { hits?: Record<string, unknown>[] })?.hits || [];
  return uniqueNegocios(hits.map((hit) => mapAlgoliaHit(hit, textQuery)));
}
