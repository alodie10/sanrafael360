import { expandIntent, hitMatchesExpansion, preferIntentHits } from "./expand-intent";
import {
  distinctiveRubroToken,
  haystackHasNeedle,
  normalizeGuideText,
  textHasRubroNeedle,
  usefulRubroTokens,
  zonaSearchNeedles,
} from "./text";
import type { RankableHit } from "./types";

export { distinctiveRubroToken, normalizeGuideText, textHasRubroNeedle } from "./text";
export { preferIntentHits };

export type ZonaHit = RankableHit & {
  nombre: string;
  zona?: string | null;
};

export function rankHitsPremiumFirst<T extends RankableHit>(
  hits: T[],
  premiumFirst = true
): T[] {
  if (!premiumFirst) return hits.slice();
  return hits.slice().sort((a, b) => Number(Boolean(b.is_premium)) - Number(Boolean(a.is_premium)));
}

export function takeTopHits<T>(hits: T[], maxResults: number): T[] {
  const cap = Number.isFinite(maxResults) ? Math.max(1, maxResults) : 3;
  return hits.slice(0, cap);
}

/** Nunca devolver fichas que no vinieron de Algolia. */
export function keepOnlySourceHits<T extends RankableHit>(hits: T[], source: T[]): T[] {
  const allowed = new Set(source.map((hit) => hit.objectID));
  return hits.filter((hit) => allowed.has(hit.objectID));
}

export function excludeHitIds<T extends RankableHit>(hits: T[], excludeIds: string[]): T[] {
  if (!excludeIds.length) return hits;
  const blocked = new Set(excludeIds);
  return hits.filter((hit) => !blocked.has(hit.objectID));
}

/** Zona es constraint, no query: no devolver un restorán de Las Paredes si pediste gomería. */
export function filterHitsByZona<T extends ZonaHit>(hits: T[], zona: string | null): T[] {
  const needles = zonaSearchNeedles(zona);
  if (!needles.length) return hits;
  return hits.filter((hit) => {
    const haystack = normalizeGuideText([hit.zona, hit.nombre].filter(Boolean).join(" "));
    return needles.some((needle) => haystack.includes(needle));
  });
}

export type RubroHit = ZonaHit & {
  categoria?: string | null;
  keywords?: string | null;
  descripcion?: string | null;
};

const FOOD_NEEDLES = [
  "resto", "restaurante", "restaurantes", "restaurant", "comida", "comidas",
  "comedor", "comedores", "parrilla", "parrillas", "gastronomia",
];
const RUBRO_SYNONYMS: Record<string, string[]> = {
  gomeria: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas"],
  resto: FOOD_NEEDLES,
  restaurante: FOOD_NEEDLES,
  comer: [...FOOD_NEEDLES, "comer"],
  alfajor: ["alfajor", "alfajores"],
  alfajores: ["alfajor", "alfajores"],
};

export function plainTextFromHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptText(value: string, max = 280): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

export function rubroNeedles(rubro: string): string[] {
  const expanded = usefulRubroTokens(rubro).flatMap((token) => RUBRO_SYNONYMS[token] || [token]);
  return [...new Set(expanded)];
}

export const GUIDE_ALGOLIA_TUNING = {
  queryLanguages: ["es"] as const,
  ignorePlurals: ["es"] as const,
  removeStopWords: ["es"] as const,
  removeWordsIfNoResults: "lastWords" as const,
};

export function algoliaRubroQuery(rubro: string): string {
  const expansion = expandIntent(rubro);
  if (expansion.queries[0]) return expansion.queries[0];
  const token = distinctiveRubroToken(rubro);
  if (!token) return rubro.trim();
  return rubroNeedles(token)[0] || token;
}

export function isWineRubro(rubro: string): boolean {
  return expandIntent(rubro).key === "vino";
}

/** Evita que el LLM deje un verbo y se pierda la clave del mapa. */
export function coerceGuideKeywords(message: string, keywords: string | null): string {
  const mapped = expandIntent(message).key || expandIntent(keywords || "").key;
  if (mapped) return mapped;
  const raw = (keywords || message).trim();
  return distinctiveRubroToken(raw) ? raw : message;
}

export function hitMatchesRubro(hit: RubroHit, rubro: string): boolean {
  const expansion = expandIntent(rubro);
  if (expansion.key) {
    return hitMatchesExpansion(
      {
        ...hit,
        descripcion: plainTextFromHtml(hit.descripcion || ""),
      },
      expansion
    );
  }
  const needles = rubroNeedles(distinctiveRubroToken(rubro) || rubro);
  if (!needles.length) return false;
  if (haystackHasNeedle(normalizeGuideText(hit.nombre), needles)) return true;
  if (haystackHasNeedle(normalizeGuideText(plainTextFromHtml(hit.descripcion || "")), needles)) {
    return true;
  }
  const categoria = normalizeGuideText(hit.categoria || "");
  if (!categoria || categoria.includes(" - ") || categoria.includes(" y ")) return false;
  if (haystackHasNeedle(categoria, needles)) return true;
  return haystackHasNeedle(normalizeGuideText(hit.keywords || ""), needles);
}

export function filterHitsByRubro<T extends RubroHit>(hits: T[], rubro: string | null): T[] {
  if (!rubro?.trim()) return hits;
  return hits.filter((hit) => hitMatchesRubro(hit, rubro));
}

/** Compat tests: hospitales primero dentro de salud. */
export function preferHospitalHits<T extends RubroHit>(hits: T[], rubro: string | null): T[] {
  return preferIntentHits(hits, expandIntent(rubro || ""));
}
