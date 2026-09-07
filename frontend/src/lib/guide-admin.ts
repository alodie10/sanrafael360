import { getStrapiUrl } from "@/lib/strapi";

export type GuideMissRow = {
  documentId: string;
  raw_query: string;
  query_norm: string;
  expanded_queries: string[];
  categories_tried: string[];
  count: number;
  estado: "pendiente" | "resuelto" | "ignorado";
  last_seen_at: string | null;
  suggested_key: string;
};

export type GuideExpansionRow = {
  documentId: string;
  key: string;
  aliases: string[];
  queries: string[];
  categories: string[];
  match_mode: string;
  exclude_name_needles: string[];
  prefer_name_needles: string[];
  activo: boolean;
  notas: string;
  edited_by: string | null;
  updatedAt?: string;
};

export type GuideSettingsRow = {
  paused: boolean;
  copy_intro: string;
  copy_no_results: string;
  copy_cta_anunciar: string;
  copy_cta_anunciar_url: string;
  llm_model: string;
  algolia_index: string;
};

function authHeaders(jwt: string): HeadersInit {
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

async function readJson(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || "No se pudo completar la acción");
  return json;
}

export function guideAdminApi(jwt: string) {
  const base = `${getStrapiUrl()}/api/guide-admin`;
  const headers = authHeaders(jwt);
  return {
    async listMisses(params: { estado?: string; q?: string; from?: string; to?: string }) {
      const query = new URLSearchParams();
      if (params.estado) query.set("estado", params.estado);
      if (params.q) query.set("q", params.q);
      if (params.from) query.set("from", params.from);
      if (params.to) query.set("to", params.to);
      const res = await fetch(`${base}/misses?${query}`, { headers, cache: "no-store" });
      const json = await readJson(res);
      return (json.data || []) as GuideMissRow[];
    },
    async patchMiss(id: string, estado: GuideMissRow["estado"]) {
      const res = await fetch(`${base}/misses/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
      });
      const json = await readJson(res);
      return json.data as GuideMissRow;
    },
    async listExpansions() {
      const res = await fetch(`${base}/expansions`, { headers, cache: "no-store" });
      const json = await readJson(res);
      return (json.data || []) as GuideExpansionRow[];
    },
    async saveExpansion(body: Record<string, unknown>, id?: string) {
      const res = await fetch(id ? `${base}/expansions/${id}` : `${base}/expansions`, {
        method: id ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await readJson(res);
      return json.data as GuideExpansionRow;
    },
    async duplicateExpansion(id: string) {
      const res = await fetch(`${base}/expansions/${id}/duplicate`, { method: "POST", headers });
      const json = await readJson(res);
      return json.data as GuideExpansionRow;
    },
    async listCategoryNames() {
      const res = await fetch(
        `${getStrapiUrl()}/api/categorias?fields[0]=nombre&sort=nombre:asc&pagination[pageSize]=100`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      const rows = (json.data || []) as Array<{ nombre?: string }>;
      return rows.map((row) => row.nombre).filter((name): name is string => Boolean(name));
    },
    async getSettings() {
      const res = await fetch(`${base}/settings`, { headers, cache: "no-store" });
      const json = await readJson(res);
      return json.data as GuideSettingsRow;
    },
    async saveSettings(body: Partial<GuideSettingsRow>) {
      const res = await fetch(`${base}/settings`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      const json = await readJson(res);
      return json.data as GuideSettingsRow;
    },
  };
}

export function formatMendoza(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Mendoza",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function listToInput(values: string[] | undefined): string {
  return (values || []).join(", ");
}
