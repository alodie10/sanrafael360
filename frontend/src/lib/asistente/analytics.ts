export type GuideEventName =
  | "guide_chat_opened"
  | "guide_query"
  | "guide_results_shown"
  | "guide_no_results"
  | "guide_cta_anunciar"
  | "guide_error";

export function trackGuideEvent(
  name: GuideEventName,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", name, params || {});
}
