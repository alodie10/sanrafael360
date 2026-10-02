import { getStrapiUrl } from "@/lib/strapi";

export type CrmPiezaPublica = {
  token: string;
  titulo: string;
  imageUrl: string;
  previewUrl: string;
  pageUrl: string;
  width: number | null;
  height: number | null;
};

export async function fetchPiezaPublica(token: string): Promise<CrmPiezaPublica | null> {
  try {
    const res = await fetch(`${getStrapiUrl()}/api/crm/pieza/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const data = json?.data;
    if (!data?.imageUrl || !data?.previewUrl) return null;
    return data as CrmPiezaPublica;
  } catch {
    return null;
  }
}
