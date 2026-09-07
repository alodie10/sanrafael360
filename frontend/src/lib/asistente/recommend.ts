import { canUseAlgoliaSearch } from "@/lib/search-config";
import { getAsistenteConfig } from "./config";
import { mapAlgoliaHitToFicha } from "./map-hit";
import {
  algoliaRubroQuery,
  excludeHitIds,
  filterHitsByRubro,
  filterHitsByZona,
  rankHitsPremiumFirst,
  takeTopHits,
} from "./rank";
import type { GuideFicha, ParsedFilters } from "./types";

function buildRubroQuery(filters: ParsedFilters): string {
  return [filters.keywords, filters.categoria]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function recommendFichasViaAlgolia(
  filters: ParsedFilters,
  excludeIds: string[] = []
): Promise<{ hits: GuideFicha[] }> {
  if (!canUseAlgoliaSearch()) {
    throw new Error("ALGOLIA_UNAVAILABLE");
  }

  const rubro = buildRubroQuery(filters);
  if (!rubro) return { hits: [] };

  const config = getAsistenteConfig();
  const { algoliasearch } = await import("algoliasearch");
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
  );
  const query = algoliaRubroQuery(rubro);

  const { results } = await client.search({
    requests: [
      {
        indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
        query,
        hitsPerPage: 50,
        restrictSearchableAttributes: ["categoria", "search_keywords", "atributos", "nombre", "descripcion"],
        attributesToRetrieve: [
          "objectID",
          "nombre",
          "slug",
          "categoria",
          "direccion",
          "descripcion",
          "is_premium",
          "whatsapp",
          "instagram_username",
          "search_keywords",
          "atributos",
        ],
        removeStopWords: true,
        ignorePlurals: true,
      },
    ],
  });

  const mapped = ((results[0] as { hits?: Record<string, unknown>[] })?.hits || [])
    .map(mapAlgoliaHitToFicha)
    .filter((hit): hit is GuideFicha => Boolean(hit));
  const sameNeed = filterHitsByRubro(mapped, rubro);
  const inZona = filterHitsByZona(sameNeed, filters.zona);
  const ranked = rankHitsPremiumFirst(excludeHitIds(inZona, excludeIds), config.premiumFirst);
  return { hits: takeTopHits(ranked, config.maxResults) };
}
