import type { RankableHit } from "./types";

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

export function normalizeGuideText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?¿!¡.,;:"“”]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Zona es constraint, no query: no devolver un restorán de Las Paredes si pediste gomería. */
export function filterHitsByZona<T extends ZonaHit>(hits: T[], zona: string | null): T[] {
  const needle = zona ? normalizeGuideText(zona) : "";
  if (needle.length < 3) return hits;
  return hits.filter((hit) => {
    const haystack = normalizeGuideText([hit.zona, hit.nombre].filter(Boolean).join(" "));
    return haystack.includes(needle);
  });
}

export type RubroHit = ZonaHit & {
  categoria?: string | null;
  keywords?: string | null;
  descripcion?: string | null;
};

const RUBRO_STOP = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "a", "en", "con", "una", "un",
  "otro", "otra", "otros", "otras", "lugar", "lugares", "cerca", "cercano", "cercana",
  "mas", "donde", "necesito", "busco", "quiero", "para", "que", "hay",
  "puedo", "podes", "puedes", "comprar", "compre", "venden", "vendo", "conseguir",
  "encontrar", "buenos", "buenas", "buen", "buena",
  "hola", "holis", "gracias", "rafi",
]);

const FOOD_NEEDLES = [
  "resto",
  "restaurante",
  "restaurantes",
  "restaurant",
  "comida",
  "comidas",
  "comedor",
  "comedores",
  "parrilla",
  "parrillas",
  "gastronomia",
];
const RUBRO_SYNONYMS: Record<string, string[]> = {
  gomeria: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas"],
  gomerias: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas"],
  rueda: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas", "balanceo"],
  ruedas: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas", "balanceo"],
  llanta: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas"],
  llantas: ["gomeria", "gomerias", "neumatico", "neumaticos", "cubierta", "cubiertas"],
  balancear: ["gomeria", "gomerias", "neumatico", "balanceo", "alineacion"],
  balanceo: ["gomeria", "gomerias", "neumatico", "balanceo", "alineacion"],
  alinear: ["gomeria", "gomerias", "neumatico", "balanceo", "alineacion"],
  alineacion: ["gomeria", "gomerias", "neumatico", "balanceo", "alineacion"],
  pinchazo: ["gomeria", "gomerias", "neumatico", "cubierta", "pinchazo"],
  resto: FOOD_NEEDLES,
  restaurante: FOOD_NEEDLES,
  restaurantes: FOOD_NEEDLES,
  restaurant: FOOD_NEEDLES,
  comer: [...FOOD_NEEDLES, "comer"],
  comida: FOOD_NEEDLES,
  comidas: FOOD_NEEDLES,
  eventos: ["evento", "eventos", "salon", "salones"],
  evento: ["evento", "eventos", "salon", "salones"],
  alfajor: ["alfajor", "alfajores"],
  alfajores: ["alfajor", "alfajores"],
  vino: ["bodega", "bodegas", "vinoteca", "vino", "vinos", "malbec"],
  vinos: ["bodega", "bodegas", "vinoteca", "vino", "vinos", "malbec"],
  bodega: ["bodega", "bodegas"],
  bodegas: ["bodega", "bodegas"],
  malbec: ["bodega", "bodegas", "malbec", "vino", "vinos"],
  visitar: ["turistico", "turismo", "visita", "visitar", "pasear"],
  visita: ["turistico", "turismo", "visita", "visitar"],
  turismo: ["turistico", "turismo", "visita", "visitar"],
  turistico: ["turistico", "turismo"],
  pasear: ["turistico", "turismo", "pasear", "visitar"],
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Evita que "comer" matchee "comercio"; sí acepta plural simple (gomería/gomerías). */
export function textHasRubroNeedle(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:es|s)?(?:[^a-z0-9]|$)`).test(haystack);
}

export function rubroNeedles(rubro: string): string[] {
  const tokens = normalizeGuideText(rubro)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !RUBRO_STOP.has(token));
  const expanded = tokens.flatMap((token) => RUBRO_SYNONYMS[token] || [token]);
  return [...new Set(expanded)];
}

/** En "dónde puedo comprar alfajores" la query útil es el producto, no el verbo. */
export function distinctiveRubroToken(rubro: string): string {
  const tokens = normalizeGuideText(rubro)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !RUBRO_STOP.has(token));
  return tokens[tokens.length - 1] || "";
}

export function algoliaRubroQuery(rubro: string): string {
  if (isTireRubro(rubro)) return "gomeria";
  const token = distinctiveRubroToken(rubro);
  if (!token) return rubro.trim();
  return rubroNeedles(token)[0] || token;
}

function haystackHasNeedle(haystack: string, needles: string[]): boolean {
  return Boolean(haystack && needles.some((needle) => textHasRubroNeedle(haystack, needle)));
}

const WINE_TOKENS = new Set(["vino", "vinos", "bodega", "bodegas", "malbec", "vinoteca", "vinotecas"]);
const TOURISM_TOKENS = new Set(["visitar", "visita", "turismo", "turistico", "turisticos", "pasear"]);
const TIRE_TOKENS = new Set([
  "rueda",
  "ruedas",
  "llanta",
  "llantas",
  "balancear",
  "balanceo",
  "alinear",
  "alineacion",
  "pinchazo",
  "pinchada",
  "pinchar",
]);
const BODEGA_PLACE = ["bodega", "bodegas", "vinoteca", "vinotecas"];
const TIRE_PLACE = [
  "gomeria",
  "gomerias",
  "gomero",
  "neumatico",
  "neumaticos",
  "cubierta",
  "cubiertas",
  "balanceo",
  "alineacion",
];

export function isWineRubro(rubro: string): boolean {
  return WINE_TOKENS.has(distinctiveRubroToken(rubro));
}

export function isTourismRubro(rubro: string): boolean {
  const n = normalizeGuideText(rubro);
  if (/\b(visitar|visita|turismo|turistico|pasear)\b/.test(n)) return true;
  return TOURISM_TOKENS.has(distinctiveRubroToken(rubro));
}

export function isTireRubro(rubro: string): boolean {
  const n = normalizeGuideText(rubro);
  if (/\b(balancear|balanceo|alinear|alineacion|pinchazo|pinchada|pinchar)\b/.test(n)) return true;
  return TIRE_TOKENS.has(distinctiveRubroToken(rubro));
}

/** Evita que el LLM deje "lugares" y se pierda "visitar". */
export function coerceGuideKeywords(message: string, keywords: string | null): string {
  const raw = (keywords || message).trim();
  if (isTourismRubro(message) || isTourismRubro(raw)) return "visitar";
  return distinctiveRubroToken(raw) ? raw : message;
}

function hitIsBodegaPlace(hit: RubroHit): boolean {
  const hay = normalizeGuideText([hit.nombre, hit.categoria].filter(Boolean).join(" "));
  return haystackHasNeedle(hay, BODEGA_PLACE);
}

function hitIsTouristPlace(hit: RubroHit): boolean {
  const categoria = normalizeGuideText(hit.categoria || "");
  return categoria.includes("interes turistic") || categoria.includes("informacion turistic");
}

function hitIsTirePlace(hit: RubroHit): boolean {
  const hay = normalizeGuideText(
    [hit.nombre, hit.categoria, plainTextFromHtml(hit.descripcion || "")].filter(Boolean).join(" ")
  );
  if (haystackHasNeedle(hay, TIRE_PLACE)) return true;
  return normalizeGuideText(hit.categoria || "").includes("gomer");
}

export function hitMatchesRubro(hit: RubroHit, rubro: string): boolean {
  const focus = distinctiveRubroToken(rubro) || rubro;
  if (isWineRubro(focus) || isWineRubro(rubro)) return hitIsBodegaPlace(hit);
  if (isTourismRubro(focus) || isTourismRubro(rubro)) return hitIsTouristPlace(hit);
  if (isTireRubro(focus) || isTireRubro(rubro)) return hitIsTirePlace(hit);
  const needles = rubroNeedles(focus);
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
