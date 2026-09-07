import { getAsistenteConfig } from "./config";
import { completeChat } from "./openai";
import { excerptText, keepOnlySourceHits } from "./rank";
import type { GuideFicha } from "./types";

export function templateRedact(hits: GuideFicha[]): string {
  if (!hits.length) return getAsistenteConfig().copyNoResults;
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

export async function redactFromHits(query: string, hits: GuideFicha[]): Promise<string> {
  if (!hits.length) return getAsistenteConfig().copyNoResults;

  const payload = hits.map((hit) => ({
    nombre: hit.nombre,
    categoria: hit.categoria,
    zona: hit.zona,
    url: hit.url,
    premium: hit.is_premium,
    descripcion: hit.descripcion,
  }));

  const system = `Redactá en es-AR (vos), máximo 2 oraciones. Citá SOLO estos hits de SR360. Usá la descripción para decir qué es el lugar, sin copiar el HTML ni inventar horarios, precios, distancias u otros comercios. No hagas pitch comercial.`;
  const user = `Consulta: ${query}\nHits: ${JSON.stringify(payload)}`;
  const drafted = await completeChat({ system, user });
  if (!drafted) return templateRedact(hits);

  const mentionedUnknown = !hits.some((hit) =>
    drafted.toLowerCase().includes(hit.nombre.toLowerCase())
  );
  if (mentionedUnknown) return templateRedact(hits);
  return drafted;
}

export function safeHits(hits: GuideFicha[], source: GuideFicha[]): GuideFicha[] {
  return keepOnlySourceHits(hits, source);
}
