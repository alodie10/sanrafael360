const RUBRO_STOP = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "a", "en", "con", "una", "un",
  "otro", "otra", "otros", "otras", "lugar", "lugares", "cerca", "cercano", "cercana",
  "mas", "donde", "necesito", "busco", "quiero", "para", "que", "hay",
  "puedo", "podes", "puedes", "comprar", "compre", "venden", "vendo", "conseguir",
  "encontrar", "buenos", "buenas", "buen", "buena",
  "hola", "holis", "gracias", "rafi",
  "dime", "decime", "dijime", "mostra", "mostrame", "indica", "indicame",
  "preferible", "preferiblemente", "posible", "tambien", "entonces", "mejor",
  "hoy", "ahora", "manana", "noche", "tarde", "manana",
  "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo",
  "persona", "personas", "gente", "pax", "adulto", "adultos",
  "abrir", "abra", "abierto", "abierta", "horario", "horarios",
  "precio", "precios", "barato", "barata", "caro", "cara",
  "recomienda", "recomiendas", "recomientas", "recomendar", "recomendame",
  "sugeris", "sugieres", "sugerir", "sugerime",
]);

const ZONA_WORDS = new Set([
  "centro", "dique", "paredes", "valle", "grande", "nihuil", "benegas",
  "nacional", "rama", "caida", "mayo", "cuadro", "villa", "padre", "real",
]);

const EXTRA_KEEP = [
  "pileta", "piscina", "estacionamiento", "wifi", "desayuno", "delivery",
  "familiar", "quincho", "asador", "mascotas", "pet", "accesible",
];

const ZONA_SEARCH_ALIASES: Record<string, string[]> = {
  dique: ["dique", "valle grande", "nihuil", "reyunos", "atuel"],
  "valle grande": ["valle grande", "dique", "atuel", "reyunos"],
  "el nihuil": ["nihuil", "dique"],
};

export function zonaSearchNeedles(zona: string | null | undefined): string[] {
  const n = normalizeGuideText(zona || "");
  if (n.length < 3) return [];
  return ZONA_SEARCH_ALIASES[n] || [n];
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

/** En "dónde puedo comprar alfajores" la query útil es el producto, no el verbo ni la zona. */
export function distinctiveRubroToken(rubro: string): string {
  const tokens = usefulRubroTokens(rubro);
  const withoutZona = tokens.filter((token) => !ZONA_WORDS.has(token));
  const pool = withoutZona.length ? withoutZona : tokens;
  return pool[pool.length - 1] || "";
}

/** Distancia 1 para typos típicos: pelqueria ↔ peluqueria. Tokens cortos no. */
export function isCloseToken(a: string, b: string): boolean {
  const left = normalizeGuideText(a);
  const right = normalizeGuideText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length < 6 || right.length < 6) return false;
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (++edits > 1) return false;
    if (left.length === right.length) {
      i += 1;
      j += 1;
    } else if (left.length > right.length) i += 1;
    else j += 1;
  }
  return edits + (left.length - i) + (right.length - j) <= 1;
}

export function extraSearchTerms(text: string): string | null {
  const n = normalizeGuideText(text);
  if (!n) return null;
  const found = EXTRA_KEEP.filter((term) => textHasRubroNeedle(n, term));
  const people = n.match(/\b(\d{1,2})\s*(personas?|pax|gente)\b/);
  if (people?.[1]) found.push(people[1], "personas");
  return found.length ? [...new Set(found)].join(" ") : null;
}

/** Quita "necesito/busco/quiero" y deja el rubro. Un reintento si Algolia dio 0. */
export function stripNeedPhrases(text: string): string {
  return usefulRubroTokens(text).join(" ");
}
