import { liveConfig } from "./live-store";
import { completeChat } from "./openai";
import { excerptText, keepOnlySourceHits } from "./rank";
import { normalizeGuideText } from "./text";
import type { GuideFicha, GuideHistoryItem } from "./types";

export function templateRedact(hits: GuideFicha[]): string {
  if (!hits.length) return liveConfig().copyNoResults;
  const bits = hits.map((hit) => {
    const hint = hit.categoria || excerptText(hit.descripcion || "", 80);
    return hint ? `${hit.nombre} (${hint})` : hit.nombre;
  });
  return `Encontré estas opciones en SR360: ${bits.join("; ")}.`;
}

export function clarifyPrompt(): string {
  return "¿Buscás un rubro puntual o una zona (centro, dique, valle grande)? Así te armo 2 o 3 fichas reales.";
}

export function greetingPrompt(): string {
  return "Hola, decime un rubro o una zona (gomería, resto, centro…) y te armo 2 o 3 fichas reales.";
}

export function zonaClarifyPrompt(): string {
  return "¿En qué zona buscás bodegas? Centro, dique, valle grande, Las Paredes, Rama Caída…";
}

function draftCitesHits(drafted: string, hits: GuideFicha[]): boolean {
  const draft = normalizeGuideText(drafted);
  return hits.some((hit) => {
    const name = normalizeGuideText(hit.nombre);
    if (draft.includes(name)) return true;
    const tokens = name.split(" ").filter((token) => token.length >= 5);
    return tokens.some((token) => draft.includes(token));
  });
}

const HIT_RULES = `Citá SOLO estos hits de SR360. Usá la descripción para decir qué es el lugar, sin copiar HTML ni inventar horarios, precios, distancias u otros comercios.
El material es contexto de ciudad/reglas. No lo uses para nombrar comercios que no estén en los hits. Si pidieron algo que no está en los hits, decilo sin inventar. No hagas pitch comercial.`;

export async function redactFromHits(
  query: string,
  hits: GuideFicha[],
  history: GuideHistoryItem[] = [],
  snippets: string[] = []
): Promise<string> {
  if (!hits.length) return liveConfig().copyNoResults;

  const payload = hits.map((hit) => ({
    nombre: hit.nombre,
    categoria: hit.categoria,
    zona: hit.zona,
    url: hit.url,
    premium: hit.is_premium,
    descripcion: hit.descripcion,
  }));

  const system = `Redactá en es-AR (vos), 2 a 4 oraciones. Atendé TODA la consulta (zona, ocasión, atributos), no solo la primera frase.
${HIT_RULES}`;
  const material = snippets.length ? `\nMaterial: ${JSON.stringify(snippets)}` : "";
  const user = `Consulta completa: ${query}\nHits: ${JSON.stringify(payload)}${material}`;
  const drafted = await completeChat({ system, user, history, maxTokens: 420 });
  if (!drafted) return templateRedact(hits);
  if (!draftCitesHits(drafted, hits)) return templateRedact(hits);
  return drafted;
}

export async function redactFromMaterial(
  query: string,
  snippets: string[],
  history: GuideHistoryItem[] = []
): Promise<string | null> {
  if (!snippets.length) return null;
  const system = `Redactá en es-AR (vos), 2 a 4 oraciones. Usá SOLO el material.
Si el material trae precio, plan, horario o regla, citálo tal cual. No inventes cifras ni comercios que no estén escritos.
No recomiendes fichas del directorio. Si el material responde la consulta, contestá.`;
  const user = `Consulta: ${query}\nMaterial: ${JSON.stringify(snippets)}`;
  const drafted = await completeChat({ system, user, history, maxTokens: 280 });
  return drafted?.trim() || snippets[0] || null;
}

export function safeHits(hits: GuideFicha[], source: GuideFicha[]): GuideFicha[] {
  return keepOnlySourceHits(hits, source);
}
