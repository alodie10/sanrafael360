import { excerptText } from "./rank";
import { normalizeGuideText, textHasRubroNeedle } from "./text";

export type GuideMaterial = {
  titulo: string;
  cuerpo: string;
};

const MATERIAL_STOP = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "a", "en", "con",
  "un", "una", "que", "es", "me", "te", "se", "al", "lo", "su",
]);

type MaterialChunk = { text: string; hay: string };

function materialTokens(query: string): string[] {
  return normalizeGuideText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !MATERIAL_STOP.has(token));
}

function splitChunks(item: GuideMaterial): MaterialChunk[] {
  const parts = item.cuerpo.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part.length >= 20);
  const blocks = parts.length ? parts : [item.cuerpo.trim()].filter(Boolean);
  return blocks.map((body) => {
    const text = excerptText(`${item.titulo}: ${body}`, 700);
    return { text, hay: normalizeGuideText(`${item.titulo} ${body}`) };
  });
}

/** Párrafos del material que hablan de la consulta. No son fichas. */
export function materialSnippets(query: string, materials: GuideMaterial[], max = 3): string[] {
  const tokens = materialTokens(query);
  if (!materials.length) return [];
  if (!tokens.length) {
    return materials.slice(0, max).map((item) => excerptText(`${item.titulo}: ${item.cuerpo}`, 700));
  }
  const scored = materials.flatMap(splitChunks).map((chunk) => ({
    chunk,
    score: tokens.reduce((acc, token) => acc + (textHasRubroNeedle(chunk.hay, token) ? 1 : 0), 0),
  }));
  const ranked = scored.filter((row) => row.score > 0).sort((a, b) => b.score - a.score);
  if (ranked.length) return ranked.slice(0, max).map((row) => row.chunk.text);
  return materials.slice(0, max).map((item) => excerptText(`${item.titulo}: ${item.cuerpo}`, 700));
}
