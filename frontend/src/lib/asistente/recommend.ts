import { canUseAlgoliaSearch } from "@/lib/search-config";
import { getAsistenteConfig } from "./config";
import {
  expandIntent,
  expansionQueries,
  expansionSearchPlan,
  hitMatchesExpansion,
  preferIntentHits,
  type IntentExpansion,
} from "./expand-intent";
import { proposeSearchKeywords } from "./extract-filters";
import { mapAlgoliaHitToFicha } from "./map-hit";
import {
  algoliaRubroQuery,
  excludeHitIds,
  filterHitsByRubro,
  filterHitsByZona,
  plainTextFromHtml,
  rankHitsPremiumFirst,
  takeTopHits,
} from "./rank";
import { stripNeedPhrases } from "./text";
import type { GuideFicha, GuideMissTrace, ParsedFilters } from "./types";

type SearchClient = {
  search: (arg: { requests: ReturnType<typeof assistantSearchRequest>[] }) => Promise<{ results: unknown[] }>;
};

const RETRIEVE_FIELDS = [
  "objectID", "nombre", "slug", "categoria", "direccion", "descripcion",
  "is_premium", "whatsapp", "instagram_username", "search_keywords", "atributos",
  "imagen_portada", "rating", "review_count", "google_rating", "google_review_count",
];

function buildRubroQuery(filters: ParsedFilters): string {
  return [filters.keywords, filters.categoria]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function assistantSearchRequest(query: string, filters?: string) {
  return {
    indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
    query,
    hitsPerPage: 50,
    filters: filters || undefined,
    restrictSearchableAttributes: ["categoria", "search_keywords", "atributos", "nombre", "descripcion"],
    attributesToRetrieve: RETRIEVE_FIELDS,
    removeStopWords: true,
    ignorePlurals: true,
    removeWordsIfNoResults: "firstWords",
  };
}

function mapHits(raw: Record<string, unknown>[] | undefined): GuideFicha[] {
  return (raw || [])
    .map(mapAlgoliaHitToFicha)
    .filter((hit): hit is GuideFicha => Boolean(hit));
}

function mergeHits(batches: GuideFicha[][]): GuideFicha[] {
  const seen = new Set<string>();
  const merged: GuideFicha[] = [];
  for (const batch of batches) {
    for (const hit of batch) {
      if (seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);
      merged.push(hit);
    }
  }
  return merged;
}

async function searchAlgolia(client: SearchClient, requests: ReturnType<typeof assistantSearchRequest>[]): Promise<GuideFicha[]> {
  if (!requests.length) return [];
  try {
    const { results } = await client.search({ requests });
    return mergeHits(
      results.map((result) => mapHits((result as { hits?: Record<string, unknown>[] }).hits))
    );
  } catch {
    return [];
  }
}

function applyNeedFilter(hits: GuideFicha[], expansion: IntentExpansion, rubro: string): GuideFicha[] {
  if (!expansion.key) return filterHitsByRubro(hits, rubro);
  return hits.filter((hit) =>
    hitMatchesExpansion({ ...hit, descripcion: plainTextFromHtml(hit.descripcion || "") }, expansion)
  );
}

async function retrieveExpanded(
  client: SearchClient,
  expansion: IntentExpansion,
  fallbackQuery: string
): Promise<{ hits: GuideFicha[]; queries: string[]; categories: string[] }> {
  const queries = expansionQueries(expansion, fallbackQuery);
  const categories = expansion.categories;
  const plan = expansionSearchPlan(expansion, fallbackQuery);
  const textHits = await searchAlgolia(
    client,
    plan.filter((item) => !item.filters).map((item) => assistantSearchRequest(item.query))
  );
  const facetHits = await searchAlgolia(
    client,
    plan
      .filter((item) => item.filters)
      .map((item) => assistantSearchRequest(item.query, item.filters))
  );
  return {
    hits: mergeHits([textHits, facetHits]),
    queries: [...new Set([...queries, ...categories])],
    categories,
  };
}

async function retrieveWithFallbacks(
  client: SearchClient,
  expansion: IntentExpansion,
  rubro: string,
  rawQuery: string,
  trace: GuideMissTrace
): Promise<GuideFicha[]> {
  const first = await retrieveExpanded(client, expansion, algoliaRubroQuery(rubro));
  trace.expanded_queries = first.queries;
  trace.categories_tried = first.categories;
  if (first.hits.length) return first.hits;

  if (!expansion.key) {
    const extra = await proposeSearchKeywords(rawQuery || rubro);
    trace.expanded_queries = [...new Set([...trace.expanded_queries, ...extra])];
    if (extra.length) {
      const extraHits = await searchAlgolia(
        client,
        extra.slice(0, 5).map((query) => assistantSearchRequest(query))
      );
      if (extraHits.length) return extraHits;
    }
  }

  const stripped = stripNeedPhrases(rawQuery || rubro);
  if (!stripped || stripped === (rawQuery || rubro).trim()) return [];
  const retry = await retrieveExpanded(client, expandIntent(stripped), stripped);
  trace.expanded_queries = [...new Set([...trace.expanded_queries, ...retry.queries])];
  trace.categories_tried = [...new Set([...trace.categories_tried, ...retry.categories])];
  return retry.hits;
}

export async function recommendFichasViaAlgolia(
  filters: ParsedFilters,
  excludeIds: string[] = [],
  rawQuery = ""
): Promise<{ hits: GuideFicha[]; trace: GuideMissTrace }> {
  const rubro = buildRubroQuery(filters);
  const trace: GuideMissTrace = { raw_query: rawQuery || rubro, expanded_queries: [], categories_tried: [] };
  if (!rubro) return { hits: [], trace };
  if (!canUseAlgoliaSearch()) throw new Error("ALGOLIA_UNAVAILABLE");

  const { algoliasearch } = await import("algoliasearch");
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
  ) as unknown as SearchClient;
  const expansion = expandIntent(rawQuery || rubro);
  const mapped = await retrieveWithFallbacks(client, expansion, rubro, rawQuery, trace);
  const sameNeed = applyNeedFilter(mapped, expansion, rubro);
  const inZona = filterHitsByZona(sameNeed, filters.zona);
  const config = getAsistenteConfig();
  const ranked = preferIntentHits(excludeHitIds(inZona, excludeIds), expansion);
  return { hits: takeTopHits(rankHitsPremiumFirst(ranked, true), config.maxResults), trace };
}
