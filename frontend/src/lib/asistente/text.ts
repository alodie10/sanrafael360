const RUBRO_STOP = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "a", "en", "con", "una", "un",
  "otro", "otra", "otros", "otras", "lugar", "lugares", "cerca", "cercano", "cercana",
  "mas", "donde", "necesito", "busco", "quiero", "para", "que", "hay",
  "puedo", "podes", "puedes", "comprar", "compre", "venden", "vendo", "conseguir",
  "encontrar", "buenos", "buenas", "buen", "buena",
  "hola", "holis", "gracias", "rafi",
  "dime", "decime", "dijime", "mostra", "mostrame", "indica", "indicame",
]);

export function normalizeGuideText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?¿!¡.,;:"“”]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Evita que "comer" matchee "comercio"; sí acepta plural simple (gomería/gomerías). */
export function textHasRubroNeedle(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:es|s)?(?:[^a-z0-9]|$)`).test(haystack);
}

export function haystackHasNeedle(haystack: string, needles: string[]): boolean {
  return Boolean(haystack && needles.some((needle) => textHasRubroNeedle(haystack, needle)));
}

/** mate ↔ mates, gomeria ↔ gomerias. */
export function lexicalVariants(token: string): string[] {
  const n = normalizeGuideText(token);
  if (!n) return [];
  const out = new Set<string>([n]);
  if (n.endsWith("es") && n.length > 4) out.add(n.slice(0, -2));
  else if (n.endsWith("s") && n.length > 3) out.add(n.slice(0, -1));
  else {
    out.add(`${n}s`);
    if (!n.endsWith("e")) out.add(`${n}es`);
  }
  return [...out];
}

export function usefulRubroTokens(rubro: string): string[] {
  return normalizeGuideText(rubro)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !RUBRO_STOP.has(token));
}

/** En "dónde puedo comprar alfajores" la query útil es el producto, no el verbo. */
export function distinctiveRubroToken(rubro: string): string {
  const tokens = usefulRubroTokens(rubro);
  return tokens[tokens.length - 1] || "";
}

/** Quita "necesito/busco/quiero" y deja el rubro. Un reintento si Algolia dio 0. */
export function stripNeedPhrases(text: string): string {
  return usefulRubroTokens(text).join(" ");
}
