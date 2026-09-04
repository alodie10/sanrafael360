import { CATEGORY_INTENT_GROUPS } from './category-intent-terms';

export const SPANISH_STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'u', 'a', 'en', 'con',
  'para', 'por', 'un', 'una', 'unos', 'unas', 'al', 'lo',
]);

const INTENT_BY_KEY: Record<string, string[]> = {};
for (const group of CATEGORY_INTENT_GROUPS) {
  for (const key of group.keys) {
    INTENT_BY_KEY[key] = group.terms;
  }
}

export function normalizeSearchKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function parseKeywordList(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[,;\n]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
}

export function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const key = normalizeSearchKey(term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(term.trim());
  }
  return result;
}

type CategoriaRef = {
  slug?: string | null;
  nombre?: string | null;
  palabras_clave?: string | null;
  parent?: CategoriaRef | null;
};

function termsForCategory(cat: CategoriaRef | null | undefined): string[] {
  if (!cat) return [];
  const fromDict = [
    ...(INTENT_BY_KEY[normalizeSearchKey(cat.slug || '')] || []),
    ...(INTENT_BY_KEY[normalizeSearchKey(cat.nombre || '')] || []),
  ];
  return uniqueTerms([...fromDict, ...parseKeywordList(cat.palabras_clave)]);
}

/** Palabras que Algolia debe asociar al comercio por su rubro (y el padre). */
export function buildSearchKeywords(categoria?: CategoriaRef | null): string[] {
  if (!categoria) return [];
  return uniqueTerms([
    ...termsForCategory(categoria),
    ...termsForCategory(categoria.parent),
  ]);
}

/** Query original + última palabra útil (pastillas de freno → freno). */
export function significantSearchTerms(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const tokens = q
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !SPANISH_STOP_WORDS.has(normalizeSearchKey(token)));
  const last = tokens[tokens.length - 1];
  return uniqueTerms(last && last.toLowerCase() !== q.toLowerCase() ? [q, last] : [q]);
}
