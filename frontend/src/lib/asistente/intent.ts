import type { GuideHistoryItem, ParsedFilters } from "./types";
import { loadIntentMap, matchIntentKey } from "./expand-intent";
import { coerceGuideKeywords } from "./rank";
import { extraSearchTerms, normalizeGuideText, textHasRubroNeedle } from "./text";

const ANUNCIAR_RE =
  /anunciar|destacar(me)?|cargar mi negocio|sumar mi negocio|ser premium|publicitar|quiero aparecer|sumar (el )?local|mi comercio en (el )?directorio/i;

const LIMPIAR_RE = /^(limpiar|reset|empezar de nuevo|borrar)$/i;
const OTRAS_RE = /otras opciones|mostrame otras|m[aá]s opciones|otras fichas|^(otro|otra|otros|otras)\b/i;
const CERCA_RE = /(?:m[aá]s\s+)?cerca de(?:l)?\s+(.+)/i;
const FOLLOW_EN_RE = /^(en|por)\s+(.+)$/i;
const REFINE_LEAD_RE = /^(y|pero|mejor|tambien|entonces)\b/i;
const REFINE_CUE_RE =
  /\b(pileta|piscina|estacionamiento|wifi|desayuno|delivery|familiar|quincho|asador|barato|barata|economico|m[aá]s cerca|otra zona|otro lado|que tenga|que sea|que quede)\b/i;
const META_QUESTION_RE =
  /^(cual|cuál|y ese|y esa|tienen|tiene whatsapp|me recomend|recomendame|alguno m[aá]s|la primera|el primero)\b/i;
const LEAD_CHITCHAT_RE =
  /^(hola+|holis|hello|hi|hey|buenas( dias| tardes| noches)?|buen dia|buenos dias)[!,.\s]*/i;

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
const ZONA_JUNK_RE = /\b(que|abra|abierto|sabado|domingo|hoy|con|sin|para|tenga|sea|lugar|lugares|rico|rica)\b/;

export function isGenericZona(value: string): boolean {
  return GENERIC_ZONA.test(normalizeGuideText(value));
}

export function findKnownZona(value: string): string | null {
  const n = normalizeGuideText(value);
  if (!n) return null;
  let best: string | null = null;
  for (const zona of KNOWN_ZONAS) {
    if (!textHasRubroNeedle(n, zona) && !n.includes(zona)) continue;
    if (!best || zona.length > best.length) best = zona;
  }
  return best;
}

function leftoverAfterZona(text: string, zona: string): string {
  return normalizeGuideText(text)
    .replace(zona, " ")
    .replace(/\b(el|la|los|las|de|del|en|por|san rafael|mendoza)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function leftoverIsZonaFiller(leftover: string): boolean {
  if (!leftover || isGenericZona(leftover)) return true;
  const tokens = leftover.split(/\s+/).filter((token) => token.length >= 3);
  return tokens.every((token) => ZONA_JUNK_RE.test(token));
}

function aliasIncludesZona(text: string, zona: string): boolean {
  const key = matchIntentKey(text);
  if (!key) return false;
  const entry = loadIntentMap()[key];
  const aliases = [key, ...(entry?.aliases || [])].map((item) => normalizeGuideText(item));
  return aliases.some((alias) => alias.includes(zona) && alias !== zona);
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

  const embedded = findKnownZona(n);
  if (embedded && leftoverIsZonaFiller(leftoverAfterZona(n, embedded))) return embedded;

  n = n.replace(/\s+(de|del)$/, "").trim();
  if (known(n)) return n;
  if (isGenericZona(n) || n.length < 3 || ZONA_JUNK_RE.test(n) || n.split(" ").length > 3) return null;
  return n;
}

export function zonaFromQuery(message: string, extractedZona?: string | null): string | null {
  const cleaned = stripLeadChitchat(message) || message;
  const split = splitRubroZona(cleaned);
  const parsed = canonicalizeZona(split.zona || extractedZona);
  if (parsed) return parsed;
  const embedded = findKnownZona(cleaned);
  if (!embedded || aliasIncludesZona(cleaned, embedded)) return null;
  return embedded;
}

export function isKnownZona(value: string): boolean {
  const n = normalizeGuideText(value);
  const zona = findKnownZona(n);
  if (!zona || !KNOWN_ZONAS.includes(zona)) return false;
  return leftoverIsZonaFiller(leftoverAfterZona(n, zona));
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

export function stripLeadChitchat(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept = sentences.filter((sentence) => !isChitchatMessage(sentence));
  const joined = (kept.length ? kept : sentences).join(" ").replace(LEAD_CHITCHAT_RE, "").trim();
  return joined || trimmed;
}

export function isFollowUpMessage(message: string, previousNeed = ""): boolean {
  const text = stripLeadChitchat(message) || message.trim();
  if (!text || LIMPIAR_RE.test(text) || ANUNCIAR_RE.test(text)) return false;
  const command = detectCommand(text);
  if (command?.command === "otras" || command?.command === "cerca") return true;
  if (FOLLOW_EN_RE.test(text)) return true;
  if (isKnownZona(text)) return true;
  if (/\bcercan[oa]s?\b/i.test(text) && !RUBRO_ZONA_RE.test(text)) return true;

  const currentKey = matchIntentKey(text);
  const prevKey = previousNeed ? matchIntentKey(previousNeed) : null;
  if (currentKey && prevKey && currentKey !== prevKey) return false;
  if (!previousNeed) return false;

  const refining =
    REFINE_LEAD_RE.test(text) ||
    REFINE_CUE_RE.test(text) ||
    META_QUESTION_RE.test(text) ||
    Boolean(findKnownZona(text) && !currentKey);
  return refining;
}

export function followUpZona(message: string): string | null {
  const text = stripLeadChitchat(message) || message.trim();
  const cerca = detectCommand(text);
  if (cerca?.command === "cerca" && cerca.zona) return canonicalizeZona(cerca.zona);
  if (isKnownZona(text) && !isGenericZona(text)) return canonicalizeZona(text);
  const en = text.match(FOLLOW_EN_RE);
  if (en?.[2] && !isGenericZona(en[2])) return canonicalizeZona(en[2]);
  return splitRubroZona(text).zona || findKnownZona(text);
}

export function lastNeedQuery(history: GuideHistoryItem[], fallback: string): string {
  let need = fallback;
  for (const item of history) {
    if (item.role !== "user") continue;
    const content = item.content.trim();
    if (
      !content ||
      isFollowUpMessage(content, need) ||
      isChitchatMessage(content) ||
      ANUNCIAR_RE.test(content) ||
      LIMPIAR_RE.test(content)
    ) {
      continue;
    }
    need = content;
  }
  return need;
}

export function composeNeedQuery(message: string, history: GuideHistoryItem[]): string {
  const cleaned = stripLeadChitchat(message) || message.trim();
  const previous = lastNeedQuery(history, "");
  if (previous && isFollowUpMessage(cleaned, previous)) {
    return `${stripLeadChitchat(previous) || previous}. ${cleaned}`;
  }
  return cleaned;
}

export function isVagueFilters(filters: ParsedFilters): boolean {
  const need = filters.keywords || filters.categoria;
  return !need || isChitchatMessage(need);
}

export function needsZonaClarify(filters: ParsedFilters): boolean {
  if (filters.zona) return false;
  return matchIntentKey(filters.keywords || filters.categoria || "") === "vino";
}

export function lastUserQuery(history: GuideHistoryItem[], fallback: string): string {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === "user") return history[i].content;
  }
  return fallback;
}

export function stripZonaPhrase(text: string, zona: string | null): string {
  if (!text || !zona) return text;
  const escaped = zona.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = text.replace(new RegExp(escaped, "ig"), " ").replace(/\s+/g, " ").trim();
  return stripped || text;
}

export function resolveFilters(message: string, extracted: ParsedFilters | null): ParsedFilters {
  const cleaned = stripLeadChitchat(message) || message;
  const split = splitRubroZona(cleaned);
  const zona = zonaFromQuery(cleaned, extracted?.zona);
  const rawKeywords = (zona ? split.keywords : extracted?.keywords) || split.keywords || cleaned;
  return {
    categoria: extracted?.categoria || null,
    zona,
    keywords: coerceGuideKeywords(cleaned, stripZonaPhrase(rawKeywords, zona)),
    extra: extracted?.extra || constraintTerms(cleaned),
  };
}

export function constraintTerms(message: string, previousNeed = ""): string | null {
  return extraSearchTerms([previousNeed, message].filter(Boolean).join(" "));
}
