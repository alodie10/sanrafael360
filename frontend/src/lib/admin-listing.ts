import { STRAPI_URL } from "@/lib/strapi";

async function adminJson(jwt: string, path: string, method: "POST" | "DELETE") {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error?.message || "No se pudo completar la acción.");
  }
  return payload as { success?: boolean; data?: { removed?: number; purged?: number; scanned?: number } };
}

export function adminDeleteNegocio(jwt: string, documentId: string) {
  return adminJson(jwt, `/negocios/admin/${encodeURIComponent(documentId)}`, "DELETE");
}

export function adminPurgeNegocioMedia(jwt: string, documentId: string) {
  return adminJson(jwt, `/negocios/admin/${encodeURIComponent(documentId)}/purge-media`, "POST");
}

export function adminPurgeNeverPremiumMediaBatch(jwt: string) {
  return adminJson(jwt, "/negocios/admin/purge-never-premium-media", "POST");
}
