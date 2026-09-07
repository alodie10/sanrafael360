const STOP = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'con', 'una', 'un',
  'otro', 'otra', 'otros', 'otras', 'lugar', 'lugares', 'cerca', 'cercano', 'cercana',
  'mas', 'donde', 'necesito', 'busco', 'quiero', 'para', 'que', 'hay',
  'puedo', 'podes', 'puedes', 'dime', 'decime',
]);

export function normalizeGuideKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?¿!¡.,;:"“”]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripNeedPhrases(text: string): string {
  return normalizeGuideKey(text)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP.has(token))
    .join(' ');
}

export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function canonicalizeCategoryNames(input: string[], catalog: string[]): string[] {
  return input.map((name) => {
    const n = normalizeGuideKey(name);
    return catalog.find((item) => normalizeGuideKey(item) === n) || name;
  });
}
