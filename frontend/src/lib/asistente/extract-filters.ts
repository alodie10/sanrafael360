import { completeChat } from "./openai";
import type { ParsedFilters } from "./types";

type LlmFilters = ParsedFilters & { intent?: "search" | "clarify" | "anunciar" };

const SYSTEM = `Extraé filtros para buscar fichas en el directorio San Rafael 360 (Mendoza).
Respondé JSON: {"intent":"search"|"clarify"|"anunciar","categoria":string|null,"zona":string|null,"keywords":string|null}.
keywords = rubro, producto o necesidad (ej. gomería, resto, comer, visitar), NUNCA la zona.
Si preguntan qué visitar o lugares para conocer, keywords=visitar.
zona = barrio/paraje (ej. Las Paredes, dique), o null.
intent=clarify si falta el rubro. No inventes comercios ni horarios.`;

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function extractFiltersWithLlm(message: string): Promise<LlmFilters | null> {
  const raw = await completeChat({ system: SYSTEM, user: message, json: true });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const intent = parsed.intent;
    return {
      intent: intent === "clarify" || intent === "anunciar" || intent === "search" ? intent : "search",
      categoria: asOptionalString(parsed.categoria),
      zona: asOptionalString(parsed.zona),
      keywords: asOptionalString(parsed.keywords),
    };
  } catch {
    return null;
  }
}
