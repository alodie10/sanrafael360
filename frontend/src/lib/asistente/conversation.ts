import { extractFiltersWithLlm } from "./extract-filters";
import {
  composeNeedQuery,
  constraintTerms,
  detectAnunciar,
  detectCommand,
  followUpZona,
  isChitchatMessage,
  isFollowUpMessage,
  isVagueFilters,
  lastNeedQuery,
  needsZonaClarify,
  resolveFilters,
  stripLeadChitchat,
} from "./intent";
import { clarifyPrompt, greetingPrompt, zonaClarifyPrompt } from "./redact";
import type { GuideTurnInput, ParsedFilters } from "./types";

export type ResolvedGuideTurn =
  | { kind: "anunciar" }
  | { kind: "chitchat" }
  | { kind: "reset" }
  | { kind: "clarify"; text: string }
  | { kind: "search"; filters: ParsedFilters; query: string; excludeIds: string[] };

function mergeFollowUpFilters(
  previous: ParsedFilters,
  message: string,
  keepZona: boolean
): ParsedFilters {
  const explicitZona = followUpZona(message);
  return {
    ...previous,
    zona: explicitZona || (keepZona ? previous.zona : null),
    extra:
      constraintTerms(message, [previous.keywords, previous.extra].filter(Boolean).join(" ")) ||
      previous.extra ||
      null,
  };
}

export async function resolveGuideTurn(input: GuideTurnInput): Promise<ResolvedGuideTurn> {
  const message = stripLeadChitchat(input.message) || input.message.trim();
  if (detectAnunciar(input.message) || detectAnunciar(message)) return { kind: "anunciar" };
  if (isChitchatMessage(input.message) || isChitchatMessage(message)) return { kind: "chitchat" };

  const command = detectCommand(message);
  if (command?.command === "limpiar") return { kind: "reset" };

  const previousNeed = lastNeedQuery(input.history, "");
  const isOtro = command?.command === "otras" || /^(otro|otra|otros|otras)\b/i.test(message);
  const followUp =
    command?.command === "otras" ||
    command?.command === "cerca" ||
    isFollowUpMessage(message, previousNeed);

  if (followUp) {
    if (!previousNeed) return { kind: "clarify", text: clarifyPrompt() };
    const filters = mergeFollowUpFilters(resolveFilters(previousNeed, null), message, !isOtro);
    if (needsZonaClarify(filters)) return { kind: "clarify", text: zonaClarifyPrompt() };
    return {
      kind: "search",
      filters,
      query: composeNeedQuery(message, input.history),
      excludeIds: isOtro ? input.excludeIds : [],
    };
  }

  const extracted = await extractFiltersWithLlm(message, input.history);
  if (extracted?.intent === "anunciar") return { kind: "anunciar" };
  const query = composeNeedQuery(message, input.history);
  const filters = resolveFilters(query, extracted);
  if (isVagueFilters(filters)) return { kind: "clarify", text: clarifyPrompt() };
  if (needsZonaClarify(filters)) return { kind: "clarify", text: zonaClarifyPrompt() };
  return { kind: "search", filters, query, excludeIds: [] };
}

export function greetingTurn() {
  return { type: "clarify" as const, text: greetingPrompt(), hits: [] };
}
