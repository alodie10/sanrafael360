import { completeChat } from "./openai";
import { intentKeys } from "./expand-intent";
import type { ParsedFilters } from "./types";

type LlmFilters = ParsedFilters & { intent?: "search" | "clarify" | "anunciar" };

function filtersSystemPrompt(): string {
  const keys = intentKeys().join(", ");
  return `Extraé filtros para buscar fichas en el directorio San Rafael 360 (Mendoza).
Respondé JSON: {"intent":"search"|"clarify"|"anunciar","categoria":string|null,"zona":string|null,"keywords":string|null}.
keywords = una clave de intención (${keys}) o el rubro/producto, NUNCA la zona ni un nombre de comercio.
zona = barrio/paraje corto (centro, dique, Las Paredes), NUNCA "San Rafael" ni la frase completa.
Si el mensaje es saludo, gracias o no hay rubro (hola, buenas, qué tal), intent=clarify y keywords=null.
intent=clarify si falta el rubro. No inventes comercios ni horarios.`;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function extractFiltersWithLlm(message: string): Promise<LlmFilters | null> {
  const raw = await completeChat({ system: filtersSystemPrompt(), user: message, json: true });
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

/** 3–5 keywords de búsqueda. Nunca nombres de comercios. */
export async function proposeSearchKeywords(message: string): Promise<string[]> {
  const raw = await completeChat({
    system:
      'Respondé JSON {"keywords":["..."]}. Máximo 5 términos de búsqueda para el directorio de San Rafael. No inventes nombres de comercios.',
    user: message,
    json: true,
  });
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { keywords?: unknown };
    if (!Array.isArray(parsed.keywords)) return [];
    return parsed.keywords
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .map((item) => item.trim())
      .slice(0, 5);
  } catch {
    return [];
  }
}
