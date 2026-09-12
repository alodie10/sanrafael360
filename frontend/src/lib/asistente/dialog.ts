import { persistGuideMiss, loadGuideRuntime, liveConfig, peekGuideRuntime } from "./live-store";
import { greetingTurn, resolveGuideTurn } from "./conversation";
import { distinctiveRubroToken } from "./rank";
import { recommendFichasViaAlgolia } from "./recommend";
import { redactFromHits, redactFromMaterial } from "./redact";
import { materialSnippets } from "./knowledge";
import type { GuideTurnInput, GuideTurnResult, ParsedFilters, GuideMissTrace } from "./types";

function anunciarResult(): GuideTurnResult {
  const config = liveConfig();
  return {
    type: "anunciar",
    text: config.copyCtaAnunciar,
    hits: [],
    cta: { label: "Escribinos", href: config.copyCtaAnunciarUrl },
  };
}

function emptyResult(filters: ParsedFilters, miss?: GuideMissTrace): GuideTurnResult {
  if (miss) {
    logGuideNoResults(miss);
    void persistGuideMiss(miss);
  }
  const config = liveConfig();
  const need = distinctiveRubroToken(filters.keywords || filters.categoria || "") || "eso";
  const text = filters.zona
    ? `No encontré opciones para ${need} en ${filters.zona}. Probá otra zona o usá la búsqueda de arriba.`
    : config.copyNoResults;
  return { type: "empty", text, hits: [], miss };
}

function logGuideNoResults(miss: GuideMissTrace): void {
  console.info(
    JSON.stringify({
      event: "guide_no_results",
      raw_query: miss.raw_query,
      expanded_queries: miss.expanded_queries,
      categories_tried: miss.categories_tried,
    })
  );
}

async function searchFichas(
  input: GuideTurnInput,
  filters: ParsedFilters,
  excludeIds: string[],
  query: string
): Promise<GuideTurnResult> {
  try {
    const { hits, trace } = await recommendFichasViaAlgolia(filters, excludeIds, query);
    const snippets = materialSnippets(query, peekGuideRuntime()?.materials || []);
    if (!hits.length) {
      const fromMaterial = await redactFromMaterial(query, snippets, input.history);
      if (fromMaterial) {
        logGuideNoResults(trace);
        void persistGuideMiss(trace);
        return { type: "empty", text: fromMaterial, hits: [], miss: trace };
      }
      return emptyResult(filters, trace);
    }
    const text = await redactFromHits(query, hits, input.history, snippets);
    return { type: "results", text, hits };
  } catch {
    return {
      type: "error",
      text: "No pude consultar el directorio ahora. Probá la búsqueda de arriba.",
      hits: [],
    };
  }
}

export async function handleGuideTurn(input: GuideTurnInput): Promise<GuideTurnResult> {
  await loadGuideRuntime(true);
  const resolved = await resolveGuideTurn(input);
  if (resolved.kind === "anunciar") return anunciarResult();
  if (resolved.kind === "chitchat") return greetingTurn();
  if (resolved.kind === "reset") {
    return { type: "reset", text: liveConfig().copyIntro, hits: [] };
  }
  if (resolved.kind === "clarify") {
    return { type: "clarify", text: resolved.text, hits: [] };
  }
  return searchFichas(input, resolved.filters, resolved.excludeIds, resolved.query);
}
