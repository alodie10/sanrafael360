export type AsistenteConfig = {
  enabled: boolean;
  copyIntro: string;
  copyNoResults: string;
  copyCtaAnunciar: string;
  copyCtaAnunciarUrl: string;
  maxResults: number;
  premiumFirst: boolean;
  pageAllowlist: string[] | null;
  rateLimitMax: number;
  rateLimitWindowMs: number;
};

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  return value !== "false" && value !== "0";
}

function envList(value: string | undefined): string[] | null {
  if (!value?.trim()) return null;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

export function getAsistenteConfig(): AsistenteConfig {
  const maxRaw = Number.parseInt(process.env.MAX_RESULTS || "3", 10);
  return {
    enabled: envFlag(process.env.ASISTENTE_ENABLED, true),
    copyIntro:
      process.env.COPY_INTRO?.trim() ||
      "Soy Rafi, tu guía en San Rafael 360. Preguntame qué necesitás…",
    copyNoResults:
      process.env.COPY_NO_RESULTS?.trim() ||
      "No encontré fichas para eso. Probá con otra zona o rubro, o usá la búsqueda de arriba.",
    copyCtaAnunciar:
      process.env.COPY_CTA_ANUNCIAR?.trim() ||
      "Si querés destacar tu negocio en SR360, escribinos acá.",
    copyCtaAnunciarUrl: process.env.COPY_CTA_ANUNCIAR_URL?.trim() || "/contacto",
    maxResults: Number.isFinite(maxRaw) ? Math.min(3, Math.max(2, maxRaw)) : 3,
    premiumFirst: envFlag(process.env.PREMIUM_FIRST, true),
    pageAllowlist: envList(process.env.ASISTENTE_PAGE_ALLOWLIST),
    rateLimitMax: 20,
    rateLimitWindowMs: 15 * 60 * 1000,
  };
}
