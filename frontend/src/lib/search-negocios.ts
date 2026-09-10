import { cache } from "@/lib/react-cache";
import { fetchFromStrapi, isStrapiUnreachableError } from "@/lib/strapi";
import { canUseAlgoliaSearch, shouldUseStrapiSearchForHome } from "@/lib/search-config";
import { Atributo, Categoria, Negocio } from "@/types/strapi";
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

function asAtributoNombre(nombre: string): Atributo {
  return { id: 0, documentId: nombre, nombre };
}

function normalizeAtributos(ui: unknown, names: unknown): Atributo[] {
  if (Array.isArray(ui)) {
    return ui.flatMap((item) => {
      if (typeof item === "string" && item.trim()) return [asAtributoNombre(item)];
      if (!item || typeof item !== "object") return [];
      const nombre = (item as { nombre?: unknown }).nombre;
      if (typeof nombre !== "string" || !nombre.trim()) return [];
      return [asAtributoNombre(nombre)];
    });
  }
  if (!Array.isArray(names)) return [];
  return names.flatMap((item) =>
    typeof item === "string" && item.trim() ? [asAtributoNombre(item)] : []
  );
}

function mapAlgoliaHit(hit: Record<string, unknown>, query?: string): Negocio {
  const mapped: Negocio = {
    id: typeof hit.id === "number" ? hit.id : 0,
    documentId: hit.objectID as string,
    slug: hit.slug as string,
    nombre: hit.nombre as string,
    descripcion: hit.descripcion as string | undefined,
    direccion: hit.direccion as string,
    whatsapp: typeof hit.whatsapp === "string" ? hit.whatsapp : undefined,
    instagram_username:
      typeof hit.instagram_username === "string" ? hit.instagram_username : undefined,
    is_premium: hit.is_premium as boolean,
    premium_valid_until: hit.premium_valid_until as string,
    categoria: hit.categoria ? ({ nombre: hit.categoria as string } as Categoria) : undefined,
    atributos: normalizeAtributos(hit.atributos_ui, hit.atributos),
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

function exactSlugHit(hits: Record<string, unknown>[], slug: string): Record<string, unknown> | undefined {
  return hits.find((hit) => hit.slug === slug || hit.objectID === slug);
}

function slugSearchTokens(slug: string): string[] {
  return slug
    .toLowerCase()
    .split("-")
    .filter((token) => token.length >= 3);
}

function hitsFromAlgoliaResult(result: unknown): Record<string, unknown>[] {
  return (result as { hits?: Record<string, unknown>[] })?.hits || [];
}

/** Ficha pública desde Algolia cuando Strapi no tiene el slug (dev) o está caído. */
export async function getNegocioFromAlgoliaBySlug(slug: string): Promise<Negocio | null> {
  if (!canUseAlgoliaSearch() || !slug.trim()) return null;
  const { algoliasearch } = await import("algoliasearch");
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
  );
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios";
  const safeSlug = slug.replace(/"/g, "");
  const tokens = slugSearchTokens(safeSlug);
  const required = tokens[0] || safeSlug.replace(/-/g, " ");
  const optional = tokens.slice(1).join(" ");

  try {
    const { results } = await client.search({
      requests: [{ indexName, query: "", filters: `slug:"${safeSlug}"`, hitsPerPage: 1 }],
    });
    const hit = exactSlugHit(hitsFromAlgoliaResult(results[0]), safeSlug);
    if (hit) return mapAlgoliaHit(hit);
  } catch {
    // slug puede no ser facetable todavía
  }

  const { results } = await client.search({
    requests: [
      {
        indexName,
        query: [required, optional].filter(Boolean).join(" "),
        optionalWords: optional || undefined,
        hitsPerPage: 40,
      },
    ],
  });
  const hit = exactSlugHit(hitsFromAlgoliaResult(results[0]), safeSlug);
  return hit ? mapAlgoliaHit(hit) : null;
}

function normalizeCatKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hitMatchesCategoriaSlug(hit: Record<string, unknown>, slug: string): boolean {
  const nombre = typeof hit.categoria === "string" ? hit.categoria : "";
  if (!nombre) return false;
  const a = normalizeCatKey(nombre);
  const b = normalizeCatKey(slug);
  return a === b || a.includes(b) || b.includes(a);
}

async function searchAlgoliaHits(query: string, hitsPerPage = 50): Promise<Record<string, unknown>[]> {
  if (!canUseAlgoliaSearch() || !query.trim()) return [];
  const { algoliasearch } = await import("algoliasearch");
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
  );
  const { results } = await client.search({
    requests: [{
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
      query,
      hitsPerPage,
      restrictSearchableAttributes: ["categoria", "nombre"],
      ignorePlurals: true,
    }],
  });
  return hitsFromAlgoliaResult(results[0]);
}

export async function getCategoriaFromAlgoliaBySlug(slug: string): Promise<Categoria | null> {
  const query = slug.replace(/_/g, " ");
  const hit = (await searchAlgoliaHits(query, 20)).find((row) => hitMatchesCategoriaSlug(row, slug));
  const nombre = typeof hit?.categoria === "string" ? hit.categoria : "";
  if (!nombre) return null;
  return {
    id: 0,
    documentId: slug,
    slug,
    nombre,
  };
}

const CATEGORIA_NEGOCIOS_POPULATE =
  "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug" +
  "&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo" +
  "&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url" +
  "&populate[owner][fields][0]=id" +
  "&fields[0]=nombre&fields[1]=slug&fields[2]=direccion&fields[3]=is_premium" +
  "&fields[4]=premium_valid_until&fields[5]=price_range&fields[6]=rating" +
  "&fields[7]=review_count&fields[8]=google_rating&fields[9]=google_review_count" +
  "&fields[10]=tripadvisor_rating&fields[11]=tripadvisor_review_count" +
  "&fields[12]=reserva_url&fields[13]=reserva_habilitada&fields[14]=cta_link&fields[15]=cta_habilitado";

async function fetchNegociosFromStrapiByCategoriaSlug(cmsSlug: string): Promise<Negocio[]> {
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options: RequestInit = {
      ...(strapiToken ? { headers: { Authorization: `Bearer ${strapiToken}` } } : {}),
      next: { revalidate: 60 },
    };
    const negocios: Negocio[] = [];
    let page = 1;
    let pageCount = 1;
    do {
      const filters = `filters[$or][0][categoria][slug][$eq]=${cmsSlug}&filters[$or][1][categoria][parent][slug][$eq]=${cmsSlug}`;
      const res = await fetchFromStrapi(
        `negocios?${filters}&${CATEGORIA_NEGOCIOS_POPULATE}&sort=nombre:asc&pagination[page]=${page}&pagination[pageSize]=100`,
        options
      );
      if (res.data) negocios.push(...res.data);
      pageCount = res.meta?.pagination?.pageCount || 1;
      page += 1;
    } while (page <= pageCount);
    return negocios;
  } catch {
    return [];
  }
}

export async function getNegociosByCategoriaSlug(cmsSlug: string): Promise<Negocio[]> {
  const fromStrapi = await fetchNegociosFromStrapiByCategoriaSlug(cmsSlug);
  if (fromStrapi.length) return fromStrapi;
  const hits = await searchAlgoliaHits(cmsSlug.replace(/_/g, " "), 100);
  return uniqueNegocios(
    hits.filter((hit) => hitMatchesCategoriaSlug(hit, cmsSlug)).map((hit) => mapAlgoliaHit(hit))
  ).sort((a, b) => Number(Boolean(b.is_premium)) - Number(Boolean(a.is_premium)));
}
