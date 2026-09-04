import { Negocio } from "@/types/strapi";

export type SearchMatchField = "nombre" | "atributos" | "categoria" | "keywords" | "descripcion";

const MATCH_RANK: Record<SearchMatchField, number> = {
  nombre: 0,
  atributos: 1,
  categoria: 2,
  keywords: 3,
  descripcion: 4,
};

const STOP_WORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "u", "a", "en", "con",
  "para", "por", "un", "una", "unos", "unas", "al", "lo",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ");
}

/** Query completa + última palabra útil: "pastillas de freno" → ["pastillas de freno", "freno"]. */
export function queryVariants(query: string): string[] {
  const original = query.trim();
  if (!original) return [];
  const tokens = original.split(/\s+/).filter((token) => {
    const n = normalize(token);
    return n.length > 2 && !STOP_WORDS.has(n);
  });
  const last = tokens[tokens.length - 1];
  if (last && last.toLowerCase() !== original.toLowerCase()) return [original, last];
  return [original];
}

function highlightMatched(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  if (Array.isArray(item)) return item.some(highlightMatched);
  const level = (item as { matchLevel?: string }).matchLevel;
  return Boolean(level && level !== "none");
}

function tagNamesFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "nombre" in item) {
      return String((item as { nombre?: string }).nombre || "");
    }
    return "";
  });
}

function textMatches(text: string, variants: string[]): boolean {
  const n = normalize(text);
  return variants.some((variant) => n.includes(variant));
}

function listMatches(values: string[], variants: string[]): boolean {
  return values.some((value) => textMatches(value, variants));
}

/** Campo de mayor prioridad en el que Algolia marcó coincidencia. */
export function matchFieldFromHighlight(hit: Record<string, unknown>): SearchMatchField | undefined {
  const hl = hit._highlightResult as Record<string, unknown> | undefined;
  if (!hl) return undefined;
  if (highlightMatched(hl.nombre)) return "nombre";
  if (highlightMatched(hl.atributos)) return "atributos";
  if (highlightMatched(hl.categoria)) return "categoria";
  if (highlightMatched(hl.search_keywords)) return "keywords";
  if (highlightMatched(hl.descripcion)) return "descripcion";
  return undefined;
}

export function matchFieldFromText(negocio: Negocio, query: string): SearchMatchField | undefined {
  const variants = queryVariants(query);
  if (variants.length === 0) return undefined;
  if (textMatches(negocio.nombre || "", variants)) return "nombre";
  if (listMatches(tagNamesFrom(negocio.atributos), variants)) return "atributos";
  const categoria = negocio.categoria;
  if (textMatches(categoria?.nombre || "", variants)) return "categoria";
  if (textMatches(categoria?.palabras_clave || "", variants)) return "keywords";
  if (textMatches(negocio.descripcion || "", variants)) return "descripcion";
  return undefined;
}

function matchFieldFromHitText(hit: Record<string, unknown>, query: string): SearchMatchField | undefined {
  const variants = queryVariants(query);
  if (variants.length === 0) return undefined;
  if (textMatches(String(hit.nombre || ""), variants)) return "nombre";
  const tags = [...tagNamesFrom(hit.atributos), ...tagNamesFrom(hit.atributos_ui)];
  if (listMatches(tags, variants)) return "atributos";
  if (textMatches(String(hit.categoria || ""), variants)) return "categoria";
  if (listMatches(tagNamesFrom(hit.search_keywords), variants)) return "keywords";
  if (textMatches(String(hit.descripcion || ""), variants)) return "descripcion";
  return undefined;
}

/** Clasifica un hit de Algolia: highlight, tags en array de strings, o texto. */
export function matchFieldFromAlgoliaHit(
  hit: Record<string, unknown>,
  query: string
): SearchMatchField | undefined {
  return matchFieldFromHighlight(hit) || matchFieldFromHitText(hit, query);
}

export function matchRank(field: SearchMatchField | undefined): number {
  if (!field) return 9;
  return MATCH_RANK[field];
}

function countPhrase(n: number, singular: string, plural: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}

/** Copy del listado: dónde coincidió y el desglose si hay de varios. */
export function buildSearchExplanation(
  count: number,
  query: string,
  fields: Array<SearchMatchField | undefined>
): string | null {
  const q = query.trim();
  if (!q || count === 0) return null;

  const n = count === 1 ? "1 comercio" : `${count} comercios`;
  const nombre = fields.filter((f) => f === "nombre").length;
  const tags = fields.filter((f) => f === "atributos").length;
  const categoria = fields.filter((f) => f === "categoria").length;
  const keywords = fields.filter((f) => f === "keywords").length;
  const desc = fields.filter((f) => f === "descripcion").length;

  if (nombre === count) return `Se encontraron ${n} con ${q} en su nombre`;
  if (tags === count) return `Se encontraron ${n} etiquetados como ${q}`;
  if (categoria === count) return `Se encontraron ${n} en el rubro ${q}`;
  if (keywords === count) return `Se encontraron ${n} relacionados con ${q}`;
  if (desc === count) return `Se encontraron ${n} con ${q} en su descripción`;

  const parts: string[] = [];
  if (nombre) parts.push(countPhrase(nombre, "en el nombre", "en el nombre"));
  if (tags) parts.push(countPhrase(tags, "etiquetado", "etiquetados"));
  if (categoria) parts.push(countPhrase(categoria, "en el rubro", "en el rubro"));
  if (keywords) parts.push(countPhrase(keywords, "relacionado", "relacionados"));
  if (desc) parts.push(countPhrase(desc, "en la descripción", "en la descripción"));

  if (parts.length === 0) return `Se encontraron ${n} con ${q} en nombre, rubro o descripción`;
  return `Se encontraron ${n} con ${q}: ${parts.join(", ")}`;
}
