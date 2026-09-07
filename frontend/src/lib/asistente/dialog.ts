import { persistGuideMiss, loadGuideRuntime, liveConfig } from "./live-store";
import { extractFiltersWithLlm } from "./extract-filters";
import { detectAnunciar, detectCommand, followUpZona, isChitchatMessage, isFollowUpMessage, canonicalizeZona, isVagueFilters, lastNeedQuery, needsZonaClarify, splitRubroZona } from "./intent";
import { matchIntentKey } from "./expand-intent";
import { coerceGuideKeywords, distinctiveRubroToken } from "./rank";
import { recommendFichasViaAlgolia } from "./recommend";
import { clarifyPrompt, greetingPrompt, redactFromHits, zonaClarifyPrompt } from "./redact";
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

function stripZonaPhrase(text: string, zona: string | null): string {
  if (!text || !zona) return text;
  const escaped = zona.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = text.replace(new RegExp(escaped, "ig"), " ").replace(/\s+/g, " ").trim();
  return stripped || text;
}

function resolveFilters(message: string, extracted: ParsedFilters | null): ParsedFilters {
  const split = splitRubroZona(message);
  const mapped = Boolean(matchIntentKey(message));
  const zonaRaw = split.zona || (!mapped ? extracted?.zona : null);
  const zona = canonicalizeZona(zonaRaw);
  const rawKeywords = (zona ? split.keywords : extracted?.keywords) || split.keywords || message;
  return {
    categoria: extracted?.categoria || null,
    zona,
    keywords: coerceGuideKeywords(message, stripZonaPhrase(rawKeywords, zona)),
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
  filters: ParsedFilters,
  excludeIds: string[],
  query: string
): Promise<GuideTurnResult> {
  try {
    const { hits, trace } = await recommendFichasViaAlgolia(filters, excludeIds, query);
    if (!hits.length) return emptyResult(filters, trace);
    const text = await redactFromHits(query, hits);
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
  const message = input.message.trim();
  if (detectAnunciar(message)) return anunciarResult();
  if (isChitchatMessage(message)) {
    return { type: "clarify", text: greetingPrompt(), hits: [] };
  }

  const command = detectCommand(message);
  if (command?.command === "limpiar") {
    return { type: "reset", text: liveConfig().copyIntro, hits: [] };
  }
  if (command?.command === "otras" || command?.command === "cerca" || isFollowUpMessage(message)) {
    const previous = lastNeedQuery(input.history, "");
    if (!previous) return { type: "clarify", text: clarifyPrompt(), hits: [] };
    const base = resolveFilters(previous, null);
    const explicitZona = followUpZona(message);
    const isOtro = command?.command === "otras" || /^(otro|otra|otros|otras)\b/i.test(message);
    const filters = {
      ...base,
      zona: explicitZona || (isOtro ? null : base.zona),
    };
    if (needsZonaClarify(filters)) {
      return { type: "clarify", text: zonaClarifyPrompt(), hits: [] };
    }
    return searchFichas(filters, input.excludeIds, previous);
  }

  const extracted = await extractFiltersWithLlm(message);
  if (extracted?.intent === "anunciar") return anunciarResult();
  const filters = resolveFilters(message, extracted);
  if (isVagueFilters(filters)) {
    return { type: "clarify", text: clarifyPrompt(), hits: [] };
  }
  if (needsZonaClarify(filters)) {
    return { type: "clarify", text: zonaClarifyPrompt(), hits: [] };
  }
  return searchFichas(filters, input.excludeIds, message);
}
