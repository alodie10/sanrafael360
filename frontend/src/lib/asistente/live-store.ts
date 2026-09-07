import { applyLiveIntentMap } from "./expand-intent";
import { getStrapiUrl } from "@/lib/strapi";
import {
  resolveLiveAsistenteConfig,
  type GuideLiveSettings,
  type GuideRuntime,
} from "./live-config";
import type { AsistenteConfig } from "./config";

export const GUIDE_RUNTIME_TTL_MS = 45_000;

export type { GuideLiveSettings, GuideRuntime };
export { resolveLiveAsistenteConfig };

let cache: { at: number; data: GuideRuntime } | null = null;

function strapiBase(): string {
  return getStrapiUrl().replace(/\/$/, "");
}

async function fetchRuntime(): Promise<GuideRuntime | null> {
  try {
    const res = await fetch(`${strapiBase()}/api/guide-runtime/map`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: GuideRuntime };
    if (!json.data?.expansions || !json.data.settings) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function loadGuideRuntime(force = false): Promise<GuideRuntime | null> {
  if (!force && cache && Date.now() - cache.at < GUIDE_RUNTIME_TTL_MS) {
    applyLiveIntentMap(cache.data.expansions);
    return cache.data;
  }
  const data = await fetchRuntime();
  if (!data) return cache?.data || null;
  cache = { at: Date.now(), data };
  applyLiveIntentMap(data.expansions);
  return data;
}

export function peekGuideRuntime(): GuideRuntime | null {
  return cache?.data || null;
}

export function liveConfig(): AsistenteConfig {
  return resolveLiveAsistenteConfig(peekGuideRuntime());
}

export async function persistGuideMiss(miss: {
  raw_query: string;
  expanded_queries: string[];
  categories_tried: string[];
}): Promise<void> {
  try {
    await fetch(`${strapiBase()}/api/guide-runtime/miss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(miss),
      cache: "no-store",
    });
  } catch {
    /* Strapi local suele estar caído; el miss queda en el log de Vercel. */
  }
}
