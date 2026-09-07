import type { ParsedFilters } from "./types";
import { isWineRubro, normalizeGuideText } from "./rank";

const ANUNCIAR_RE =
  /anunciar|destacar(me)?|cargar mi negocio|sumar mi negocio|ser premium|publicitar|quiero aparecer|sumar (el )?local|mi comercio en (el )?directorio/i;

const LIMPIAR_RE = /^(limpiar|reset|empezar de nuevo|borrar)$/i;
const OTRAS_RE = /otras opciones|mostrame otras|m[aá]s opciones|otras fichas|^(otro|otra|otros|otras)\b/i;
const CERCA_RE = /(?:m[aá]s\s+)?cerca de(?:l)?\s+(.+)/i;
const FOLLOW_EN_RE = /^(en|por)\s+(.+)$/i;

export type GuideCommand = "limpiar" | "otras" | "cerca";

export function detectAnunciar(message: string): boolean {
  return ANUNCIAR_RE.test(message.trim());
}

export function detectCommand(message: string): { command: GuideCommand; zona?: string } | null {
  const text = message.trim();
  if (LIMPIAR_RE.test(text)) return { command: "limpiar" };
  if (OTRAS_RE.test(text)) return { command: "otras" };
  const cerca = text.match(CERCA_RE);
  if (cerca?.[1] && !/^(.+?)\s+(?:en|cerca de|cerca del|por)\s+/i.test(text)) {
    return { command: "cerca", zona: cerca[1].trim() };
  }
  return null;
}

const GENERIC_ZONA = /^(san rafael|mendoza|la ciudad|aca|acá|aqui|aquí)$/i;
const KNOWN_ZONAS = new Set([
  "centro",
  "dique",
  "valle grande",
  "las paredes",
  "rama caida",
  "cuadro nacional",
  "el nihuil",
  "real del padre",
  "villa 25 de mayo",
  "cuadro benegas",
]);
const RUBRO_ZONA_RE = /^(.+?)\s+(?:en|cerca de|cerca del|por)\s+(.+)$/i;

export function isGenericZona(value: string): boolean {
  return GENERIC_ZONA.test(value.trim());
}

export function isKnownZona(value: string): boolean {
  return KNOWN_ZONAS.has(normalizeGuideText(value));
}

export function splitRubroZona(message: string): { keywords: string; zona: string | null } {
  const text = message.trim();
  const match = text.match(RUBRO_ZONA_RE);
  if (!match?.[1] || !match[2]) return { keywords: text, zona: null };
  const zona = match[2].trim();
  const keywords = match[1].trim();
  if (!keywords || isGenericZona(zona)) return { keywords: text, zona: null };
  return { keywords, zona };
}

export function isFollowUpMessage(message: string): boolean {
  const text = message.trim();
  if (!text || LIMPIAR_RE.test(text) || ANUNCIAR_RE.test(text)) return false;
  const command = detectCommand(text);
  if (command?.command === "otras" || command?.command === "cerca") return true;
  if (FOLLOW_EN_RE.test(text)) return true;
  if (isKnownZona(text)) return true;
  if (/\bcercan[oa]s?\b/i.test(text) && !RUBRO_ZONA_RE.test(text)) return true;
  return false;
}

export function followUpZona(message: string): string | null {
  const text = message.trim();
  const cerca = detectCommand(text);
  if (cerca?.command === "cerca" && cerca.zona) return cerca.zona;
  if (isKnownZona(text) && !isGenericZona(text)) return text;
  const en = text.match(FOLLOW_EN_RE);
  if (en?.[2] && !isGenericZona(en[2])) return en[2].trim();
  return splitRubroZona(text).zona;
}

export function lastNeedQuery(
  history: { role: string; content: string }[],
  fallback: string
): string {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role !== "user") continue;
    const content = history[i].content.trim();
    if (!content || isFollowUpMessage(content) || ANUNCIAR_RE.test(content) || LIMPIAR_RE.test(content)) {
      continue;
    }
    return content;
  }
  return fallback;
}

export function isVagueFilters(filters: ParsedFilters): boolean {
  return !filters.categoria && !filters.keywords;
}

export function needsZonaClarify(filters: ParsedFilters): boolean {
  if (filters.zona) return false;
  return isWineRubro(filters.keywords || filters.categoria || "");
}

export function lastUserQuery(history: { role: string; content: string }[], fallback: string): string {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === "user") return history[i].content;
  }
  return fallback;
}
