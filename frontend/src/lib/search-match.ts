import { Negocio } from "@/types/strapi";

export type SearchMatchField = "nombre" | "atributos" | "descripcion";

const MATCH_RANK: Record<SearchMatchField, number> = {
  nombre: 0,
  atributos: 1,
  descripcion: 2,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ");
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

/** Campo de mayor prioridad en el que Algolia marcó coincidencia. */
export function matchFieldFromHighlight(hit: Record<string, unknown>): SearchMatchField | undefined {
  const hl = hit._highlightResult as Record<string, unknown> | undefined;
  if (!hl) return undefined;
  if (highlightMatched(hl.nombre)) return "nombre";
  if (highlightMatched(hl.atributos)) return "atributos";
  if (highlightMatched(hl.descripcion)) return "descripcion";
  return undefined;
}

export function matchFieldFromText(negocio: Negocio, query: string): SearchMatchField | undefined {
  const q = normalize(query);
  if (!q) return undefined;
  if (normalize(negocio.nombre || "").includes(q)) return "nombre";
  if (tagNamesFrom(negocio.atributos).some((name) => normalize(name).includes(q))) return "atributos";
  if (normalize(negocio.descripcion || "").includes(q)) return "descripcion";
  return undefined;
}

/** Clasifica un hit de Algolia: highlight, tags en array de strings, o texto. */
export function matchFieldFromAlgoliaHit(
  hit: Record<string, unknown>,
  query: string
): SearchMatchField | undefined {
  const fromHighlight = matchFieldFromHighlight(hit);
  if (fromHighlight) return fromHighlight;

  const q = normalize(query);
  if (!q) return undefined;
  if (normalize(String(hit.nombre || "")).includes(q)) return "nombre";
  const tags = [...tagNamesFrom(hit.atributos), ...tagNamesFrom(hit.atributos_ui)];
  if (tags.some((name) => normalize(name).includes(q))) return "atributos";
  if (normalize(String(hit.descripcion || "")).includes(q)) return "descripcion";
  return undefined;
}

export function matchRank(field: SearchMatchField | undefined): number {
  if (!field) return 9;
  return MATCH_RANK[field];
}

function countPhrase(n: number, singular: string, plural: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}

/** Copy del listado: nombre, etiquetas o descripción — y el desglose si hay de varios. */
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
  const desc = fields.filter((f) => f === "descripcion").length;

  if (nombre === count) return `Se encontraron ${n} con ${q} en su nombre`;
  if (tags === count) return `Se encontraron ${n} etiquetados como ${q}`;
  if (desc === count) return `Se encontraron ${n} con ${q} en su descripción`;

  const parts: string[] = [];
  if (nombre) parts.push(countPhrase(nombre, "en el nombre", "en el nombre"));
  if (tags) parts.push(countPhrase(tags, "etiquetado", "etiquetados"));
  if (desc) parts.push(countPhrase(desc, "en la descripción", "en la descripción"));

  if (parts.length === 0) return `Se encontraron ${n} con ${q} en nombre, etiquetas o descripción`;
  return `Se encontraron ${n} con ${q}: ${parts.join(", ")}`;
}
