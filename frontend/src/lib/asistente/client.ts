import type { GuideHistoryItem, GuideTurnResult } from "./types";

export async function postGuideTurn(input: {
  message: string;
  history: GuideHistoryItem[];
  excludeIds: string[];
}): Promise<GuideTurnResult> {
  const response = await fetch("/api/asistente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as GuideTurnResult & { error?: string };
  if (!response.ok && !payload.type) {
    return {
      type: "error",
      text: payload.error || "No pude consultar el directorio ahora. Probá la búsqueda de arriba.",
      hits: [],
    };
  }
  return {
    type: payload.type || "error",
    text: payload.text || "No pude consultar el directorio ahora. Probá la búsqueda de arriba.",
    hits: Array.isArray(payload.hits) ? payload.hits : [],
    cta: payload.cta,
    miss: payload.miss,
  };
}
