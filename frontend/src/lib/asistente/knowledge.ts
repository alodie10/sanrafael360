import { excerptText } from "./rank";
import { normalizeGuideText, textHasRubroNeedle, usefulRubroTokens } from "./text";

export type GuideMaterial = {
  titulo: string;
  cuerpo: string;
};

type MaterialChunk = { text: string; hay: string };

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
  const tokens = usefulRubroTokens(query);
  if (!tokens.length || !materials.length) return [];
  const scored = materials.flatMap(splitChunks).map((chunk) => ({
    chunk,
    score: tokens.reduce((acc, token) => acc + (textHasRubroNeedle(chunk.hay, token) ? 1 : 0), 0),
  }));
  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((row) => row.chunk.text);
}
