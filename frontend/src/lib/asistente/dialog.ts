import { getAsistenteConfig } from "./config";
import { extractFiltersWithLlm } from "./extract-filters";
import { detectAnunciar, detectCommand, followUpZona, isFollowUpMessage, isGenericZona, isVagueFilters, lastNeedQuery, needsZonaClarify, splitRubroZona } from "./intent";
import { coerceGuideKeywords } from "./rank";
import { recommendFichasViaAlgolia } from "./recommend";
import { clarifyPrompt, redactFromHits, zonaClarifyPrompt } from "./redact";
import type { GuideTurnInput, GuideTurnResult, ParsedFilters } from "./types";

function anunciarResult(): GuideTurnResult {
  const config = getAsistenteConfig();
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
  const zonaRaw = extracted?.zona || split.zona;
  const zona = zonaRaw && !isGenericZona(zonaRaw) ? zonaRaw : null;
  const rawKeywords = (zona ? split.keywords : extracted?.keywords) || split.keywords || message;
  return {
    categoria: extracted?.categoria || null,
    zona,
    keywords: coerceGuideKeywords(message, stripZonaPhrase(rawKeywords, zona)),
  };
}

function emptyResult(filters: ParsedFilters): GuideTurnResult {
  const config = getAsistenteConfig();
  const rubro = filters.keywords || filters.categoria;
  const text =
    filters.zona && rubro
      ? `No encontré ${rubro} en ${filters.zona}. Probá otra zona o usá la búsqueda de arriba.`
      : config.copyNoResults;
  return { type: "empty", text, hits: [] };
}

async function searchFichas(
  filters: ParsedFilters,
  excludeIds: string[],
  query: string
): Promise<GuideTurnResult> {
  try {
    const { hits } = await recommendFichasViaAlgolia(filters, excludeIds);
    if (!hits.length) return emptyResult(filters);
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
  const message = input.message.trim();
  if (detectAnunciar(message)) return anunciarResult();

  const command = detectCommand(message);
  if (command?.command === "limpiar") {
    return { type: "reset", text: getAsistenteConfig().copyIntro, hits: [] };
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
