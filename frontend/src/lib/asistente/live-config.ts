import { getAsistenteConfig, type AsistenteConfig } from "./config";
import type { IntentMap } from "./expand-intent";

export type GuideLiveSettings = {
  paused: boolean;
  copy_intro: string;
  copy_no_results: string;
  copy_cta_anunciar: string;
  copy_cta_anunciar_url: string;
  llm_model?: string;
  algolia_index?: string;
};

export type GuideRuntime = {
  expansions: IntentMap;
  settings: GuideLiveSettings;
};

export function resolveLiveAsistenteConfig(runtime: GuideRuntime | null): AsistenteConfig {
  const env = getAsistenteConfig();
  if (!runtime) return env;
  const settings = runtime.settings;
  return {
    ...env,
    enabled: env.enabled && !settings.paused,
    copyIntro: settings.copy_intro?.trim() || env.copyIntro,
    copyNoResults: settings.copy_no_results?.trim() || env.copyNoResults,
    copyCtaAnunciar: settings.copy_cta_anunciar?.trim() || env.copyCtaAnunciar,
    copyCtaAnunciarUrl: settings.copy_cta_anunciar_url?.trim() || env.copyCtaAnunciarUrl,
  };
}
