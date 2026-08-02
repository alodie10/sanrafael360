import { fetchFromStrapi } from "@/lib/strapi";

export interface PortalStatsSummary {
  views: number;
  clicks_whatsapp: number;
  clicks_website: number;
  profileScore?: number;
  totalNegocios?: number;
}

export interface PortalStatsBreakdown {
  documentId?: string;
  nombre?: string;
  views: number;
  clicks_whatsapp: number;
  clicks_website: number;
  profile_score?: number;
  is_premium?: boolean;
  premium_valid_until?: string;
}

export interface PortalStatsPayload {
  summary: PortalStatsSummary;
  breakdown: PortalStatsBreakdown[];
}

export interface SuscripcionPrices {
  mensual: number;
  semestral: number;
}

function normalizePortalStats(response: Record<string, unknown>): PortalStatsPayload {
  const payload = (response.data as Record<string, unknown>) || response;
  const summary =
    (payload.summary as PortalStatsSummary) ||
    (payload as unknown as PortalStatsSummary);
  const breakdown = (payload.breakdown as PortalStatsBreakdown[]) || [];

  return {
    summary: {
      views: summary.views || 0,
      clicks_whatsapp: summary.clicks_whatsapp || 0,
      clicks_website: summary.clicks_website || 0,
      profileScore: summary.profileScore || 0,
      totalNegocios: summary.totalNegocios || 0,
    },
    breakdown,
  };
}

export async function getPortalNegocios(jwt: string) {
  try {
    // Usa stats/summary (ruta estable). `/negocios/me` choca con findOne :documentId → 404.
    const response = await fetchFromStrapi("negocios/stats/summary?includeNegocios=1", {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    const payload = response.data || {};
    return payload.negocios || [];
  } catch {
    return [];
  }
}

export async function getPortalStats(
  jwt: string,
  startDate?: string,
  endDate?: string
): Promise<PortalStatsPayload | null> {
  try {
    let path = "negocios/stats/summary";
    if (startDate && endDate) {
      path += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }

    const response = await fetchFromStrapi(path, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });

    return normalizePortalStats(response);
  } catch {
    return null;
  }
}

export async function getSuscripcionPrices(): Promise<SuscripcionPrices | null> {
  try {
    const response = await fetchFromStrapi("suscripcion-config", {
      next: { revalidate: 3600 },
    });
    const data = response.data;
    if (!data) return null;

    return {
      mensual: data.precio_mensual,
      semestral: data.precio_semestral,
    };
  } catch {
    return null;
  }
}
