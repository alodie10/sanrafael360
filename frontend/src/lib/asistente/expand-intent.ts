import intentMap from "./intent-map.json";
import { distinctiveRubroToken, haystackHasNeedle, lexicalVariants, normalizeGuideText, stripNeedPhrases, textHasRubroNeedle } from "./text";

export type IntentEntry = {
  aliases?: string[];
  queries: string[];
  categories: string[];
  match?: "default" | "category" | "category_or_name" | "name_or_desc";
  excludeNameNeedles?: string[];
  preferNameNeedles?: string[];
};

export type IntentExpansion = {
  key: string | null;
  queries: string[];
  categories: string[];
  match: "default" | "category" | "category_or_name" | "name_or_desc";
  excludeNameNeedles: string[];
  preferNameNeedles: string[];
};

type IntentMap = Record<string, IntentEntry>;

export type { IntentMap };

const seedMap = intentMap as IntentMap;
let liveMap: IntentMap | null = null;

export function applyLiveIntentMap(map: IntentMap | null): void {
  liveMap = map && Object.keys(map).length ? map : null;
}

export function loadIntentMap(): IntentMap {
  return liveMap || seedMap;
}

export function intentKeys(): string[] {
  return Object.keys(loadIntentMap());
}

function textHasAlias(haystack: string, alias: string): boolean {
  const needle = normalizeGuideText(alias);
  if (!needle) return false;
  if (needle.includes(" ")) return ` ${haystack} `.includes(` ${needle} `);
  return textHasRubroNeedle(haystack, needle);
}

/** Match por alias/clave. También “quiero mate” → key `mate`. */
export function matchIntentKey(raw: string): string | null {
  const hays = [...new Set([normalizeGuideText(raw), stripNeedPhrases(raw)].filter(Boolean))];
  if (!hays.length) return null;
  let best: { key: string; len: number } | null = null;
  for (const hay of hays) {
    for (const [key, entry] of Object.entries(loadIntentMap())) {
      const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
      for (const alias of [key, ...aliases]) {
        for (const base of [...new Set([normalizeGuideText(alias), stripNeedPhrases(alias)].filter(Boolean))]) {
          for (const needle of lexicalVariants(base)) {
            if (!textHasAlias(hay, needle) && !lexicalVariants(hay).some((variant) => textHasAlias(variant, needle))) {
              continue;
            }
            if (!best || needle.length > best.len) best = { key, len: needle.length };
          }
        }
      }
    }
  }
  return best?.key ?? null;
}

export function expandIntent(raw: string): IntentExpansion {
  const key = matchIntentKey(raw) || matchIntentKey(distinctiveRubroToken(raw));
  const empty: IntentExpansion = {
    key: null,
    queries: [],
    categories: [],
    match: "default",
    excludeNameNeedles: [],
    preferNameNeedles: [],
  };
  if (!key) return empty;
  const entry = loadIntentMap()[key];
  if (!entry) return empty;
  return {
    key,
    queries: [...new Set(entry.queries.map((item) => normalizeGuideText(item)).filter(Boolean))],
    categories: [...entry.categories],
    match: entry.match || "default",
    excludeNameNeedles: [...(entry.excludeNameNeedles || [])],
    preferNameNeedles: [...(entry.preferNameNeedles || [])],
  };
}

export function categoryFilter(categories: string[]): string {
  return categories
    .map((name) => `categoria:"${name.replace(/"/g, "")}"`)
    .join(" OR ");
}

export type ExpansionSearchRequest = { query: string; filters?: string };

function uniqueTerms(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export function expansionQueries(expansion: IntentExpansion, fallbackQuery: string): string[] {
  const base = expansion.queries.length ? expansion.queries : [fallbackQuery];
  return uniqueTerms(base.flatMap((query) => [query, ...lexicalVariants(query)])).slice(0, 6);
}

/** Text query by category name first: prod `negocios` often has 0 hits on the facet filter. */
export function expansionSearchPlan(
  expansion: IntentExpansion,
  fallbackQuery: string
): ExpansionSearchRequest[] {
  const requests: ExpansionSearchRequest[] = expansion.categories.map((category) => ({ query: category }));
  if (expansion.categories.length) {
    requests.push({ query: "", filters: categoryFilter(expansion.categories) });
  }
  const skipTerms = expansion.match === "category" && expansion.categories.length > 0;
  if (!skipTerms) {
    for (const query of expansionQueries(expansion, fallbackQuery)) {
      requests.push({ query });
    }
  }
  return requests;
}

export function hitMatchesExpansion(
  hit: { nombre?: string | null; categoria?: string | null; keywords?: string | null; descripcion?: string | null },
  expansion: IntentExpansion
): boolean {
  const nombre = normalizeGuideText(hit.nombre || "");
  if (expansion.excludeNameNeedles.length && haystackHasNeedle(nombre, expansion.excludeNameNeedles)) {
    return false;
  }
  const categoria = normalizeGuideText(hit.categoria || "");
  const categoryHit = expansion.categories.some(
    (name) => categoria && categoria === normalizeGuideText(name)
  );
  if (expansion.match === "category") return categoryHit;
  if (expansion.match === "category_or_name") {
    return categoryHit || haystackHasNeedle(nombre, expansion.queries);
  }
  if (expansion.match === "name_or_desc") {
    const hay = `${nombre} ${normalizeGuideText(hit.descripcion || "")}`;
    return haystackHasNeedle(hay, expansion.queries);
  }
  if (categoryHit) return true;
  const hay = [nombre, categoria, normalizeGuideText(hit.keywords || ""), normalizeGuideText(hit.descripcion || "")]
    .join(" ");
  return haystackHasNeedle(hay, expansion.queries);
}

export function preferIntentHits<T extends { nombre?: string | null; is_premium?: boolean }>(
  hits: T[],
  expansion: IntentExpansion
): T[] {
  return hits.slice().sort((a, b) => {
    const prem = Number(Boolean(b.is_premium)) - Number(Boolean(a.is_premium));
    if (prem) return prem;
    const prefer = expansion.preferNameNeedles.length ? expansion.preferNameNeedles : expansion.queries;
    if (!prefer.length) return 0;
    const score = (hit: T) => {
      const nombre = normalizeGuideText(hit.nombre || "");
      return prefer.reduce(
        (acc, needle, index) => acc + (textHasRubroNeedle(nombre, needle) ? prefer.length - index : 0),
        0
      );
    };
    return score(b) - score(a);
  });
}

export function algoliaSynonymHits(): Array<{ objectID: string; type: "synonym"; synonyms: string[] }> {
  return Object.entries(loadIntentMap()).map(([key, entry]) => ({
    objectID: `sr360-guide-${key}`,
    type: "synonym" as const,
    synonyms: [...new Set([key, ...(entry.aliases || []), ...entry.queries].map((term) => term.trim()).filter(Boolean))],
  }));
}
