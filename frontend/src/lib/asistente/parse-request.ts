import type { GuideHistoryItem, GuideTurnInput } from "./types";

const MAX_MESSAGE = 500;
const MAX_HISTORY = 10;
const MAX_EXCLUDE = 20;

function asHistory(value: unknown): GuideHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-MAX_HISTORY)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { role?: unknown; content?: unknown };
      if (row.role !== "user" && row.role !== "assistant") return null;
      if (typeof row.content !== "string") return null;
      return { role: row.role, content: row.content.slice(0, MAX_MESSAGE) };
    })
    .filter((item): item is GuideHistoryItem => Boolean(item));
}

export function parseGuideRequest(body: unknown): GuideTurnInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "Pedido inválido" };
  const row = body as { message?: unknown; history?: unknown; excludeIds?: unknown };
  if (typeof row.message !== "string" || !row.message.trim()) {
    return { error: "Escribí qué necesitás en San Rafael" };
  }
  const excludeIds = Array.isArray(row.excludeIds)
    ? row.excludeIds.filter((id): id is string => typeof id === "string").slice(0, MAX_EXCLUDE)
    : [];
  return {
    message: row.message.trim().slice(0, MAX_MESSAGE),
    history: asHistory(row.history),
    excludeIds,
  };
}
