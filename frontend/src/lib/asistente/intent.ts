import type { ParsedFilters } from "./types";
import { isWineRubro, normalizeGuideText } from "./rank";

const ANUNCIAR_RE =
  /anunciar|destacar(me)?|cargar mi negocio|sumar mi negocio|ser premium|publicitar|quiero aparecer|sumar (el )?local|mi comercio en (el )?directorio/i;

const LIMPIAR_RE = /^(limpiar|reset|empezar de nuevo|borrar)$/i;
const OTRAS_RE = /otras opciones|mostrame otras|m[aá]s opciones|otras fichas|^(otro|otra|otros|otras)\b/i;
const CERCA_RE = /(?:m[aá]s\s+)?cerca de(?:l)?\s+(.+)/i;
const FOLLOW_EN_RE = /^(en|por)\s+(.+)$/i;

export type GuideCommand = "limpiar" | "otras" | "cerca";

const CHITCHAT_RE =
  /^(hola+|holis|hello|hi|hey|buenas( dias| tardes| noches)?|buen dia|buenos dias|que tal|hola que tal|como estas|como va|todo bien|gracias|ok+|oka|dale|listo|chau|adios|rafi|hola rafi|hey rafi)$/;

export function detectAnunciar(message: string): boolean {
  return ANUNCIAR_RE.test(message.trim());
}

/** Saludo o muletilla: no buscar fichas (Algolia matchea "hola" con descripciones). */
export function isChitchatMessage(message: string): boolean {
  const n = normalizeGuideText(message);
  return !n || CHITCHAT_RE.test(n);
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
const KNOWN_ZONAS = [
  "valle grande",
  "las paredes",
  "rama caida",
  "cuadro nacional",
  "cuadro benegas",
  "villa 25 de mayo",
  "real del padre",
  "el nihuil",
  "centro",
  "dique",
];
const RUBRO_ZONA_RE = /^(.+?)\s+(?:en|cerca de|cerca del|por)\s+(.+)$/i;

export function isGenericZona(value: string): boolean {
  return GENERIC_ZONA.test(normalizeGuideText(value));
}

/** "el centro de san rafael" → "centro". No tratar un pedido completo como zona. */
export function canonicalizeZona(value: string | null | undefined): string | null {
  if (!value) return null;
  let n = normalizeGuideText(value);
  if (!n || isGenericZona(n)) return null;
  const known = (s: string) => KNOWN_ZONAS.find((zona) => zona === s) || null;
  if (known(n)) return n;

  n = n.replace(/\b(san rafael|mendoza)\b/g, " ").replace(/\s+/g, " ").trim();
  if (!n || isGenericZona(n)) return null;
  if (known(n)) return n;

  n = n.replace(/^(en|por|de|del)\s+/, "").trim();
  if (known(n)) return n;

  const noArticle = n.replace(/^(el|la|los|las)\s+/, "").replace(/\s+(de|del)$/, "").trim();
  if (known(noArticle)) return noArticle;

  n = n.replace(/\s+(de|del)$/, "").trim();
  if (known(n)) return n;
  if (isGenericZona(n) || n.length < 3) return null;
  return n;
}

export function isKnownZona(value: string): boolean {
  const zona = canonicalizeZona(value);
  return Boolean(zona && KNOWN_ZONAS.includes(zona));
}

export function splitRubroZona(message: string): { keywords: string; zona: string | null } {
  const text = message.trim();
  const match = text.match(RUBRO_ZONA_RE);
  if (!match?.[1] || !match[2]) return { keywords: text, zona: null };
  const zona = canonicalizeZona(match[2]);
  const keywords = match[1].trim();
  if (!keywords || !zona) return { keywords: text, zona: null };
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
  if (cerca?.command === "cerca" && cerca.zona) return canonicalizeZona(cerca.zona);
  if (isKnownZona(text) && !isGenericZona(text)) return canonicalizeZona(text);
  const en = text.match(FOLLOW_EN_RE);
  if (en?.[2] && !isGenericZona(en[2])) return canonicalizeZona(en[2]);
  return splitRubroZona(text).zona;
}

export function lastNeedQuery(
  history: { role: string; content: string }[],
  fallback: string
): string {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role !== "user") continue;
    const content = history[i].content.trim();
    if (
      !content ||
      isFollowUpMessage(content) ||
      isChitchatMessage(content) ||
      ANUNCIAR_RE.test(content) ||
      LIMPIAR_RE.test(content)
    ) {
      continue;
    }
    return content;
  }
  return fallback;
}

export function isVagueFilters(filters: ParsedFilters): boolean {
  const need = filters.keywords || filters.categoria;
  return !need || isChitchatMessage(need);
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
