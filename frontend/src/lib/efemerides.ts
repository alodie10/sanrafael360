import { cache } from "react";
import { getStrapiUrl } from "@/lib/strapi";
import type { EfemeridePublic } from "@/types/strapi";

export const fetchEfemeridePublic = cache(async function fetchEfemeridePublic(
  slug: string,
  options: RequestInit = {}
): Promise<EfemeridePublic | null> {
  const token = process.env.STRAPI_API_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${getStrapiUrl()}/api/efemerides/public/${encodeURIComponent(slug)}`,
    { cache: "no-store", ...options, headers }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo cargar la efeméride (${res.status})`);

  const json = await res.json();
  return json.data ?? null;
});

export async function fetchEfemeridesPublicList(options: RequestInit = {}) {
  const token = process.env.STRAPI_API_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getStrapiUrl()}/api/efemerides/public`, {
    cache: "no-store",
    ...options,
    headers,
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}
