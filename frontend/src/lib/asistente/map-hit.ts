import { normalizeInstagramUsername } from "@/lib/instagram";
import { normalizeWhatsappDigits } from "@/lib/whatsapp";
import { excerptText, plainTextFromHtml } from "./rank";
import type { GuideFicha } from "./types";

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function coverFromHit(hit: Record<string, unknown>): string | null {
  const media = hit.imagen_portada;
  if (!media || typeof media !== "object") return null;
  return asString((media as { url?: unknown }).url);
}

function ratingFromHit(hit: Record<string, unknown>): { rating: number; count: number } | null {
  const nativeCount = asNumber(hit.review_count);
  const nativeRating = asNumber(hit.rating);
  if (nativeCount && nativeRating) return { rating: nativeRating, count: nativeCount };
  const googleCount = asNumber(hit.google_review_count);
  const googleRating = asNumber(hit.google_rating);
  if (googleCount && googleRating) return { rating: googleRating, count: googleCount };
  return null;
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

function keywordsFromHit(hit: Record<string, unknown>): string | null {
  return asString([...stringList(hit.search_keywords), ...stringList(hit.atributos)].join(" "));
}

export function mapAlgoliaHitToFicha(hit: Record<string, unknown>): GuideFicha | null {
  const objectID = asString(hit.objectID);
  const nombre = asString(hit.nombre);
  const slug = asString(hit.slug);
  if (!objectID || !nombre || !slug) return null;
  const reviews = ratingFromHit(hit);

  return {
    objectID,
    nombre,
    slug,
    url: `/negocios/${slug}`,
    categoria: asString(hit.categoria),
    zona: asString(hit.direccion),
    is_premium: Boolean(hit.is_premium),
    whatsapp: normalizeWhatsappDigits(asString(hit.whatsapp)),
    instagram_username: normalizeInstagramUsername(asString(hit.instagram_username)),
    keywords: keywordsFromHit(hit),
    descripcion: excerptText(plainTextFromHtml(hit.descripcion)) || null,
    coverUrl: coverFromHit(hit),
    rating: reviews?.rating ?? null,
    reviewCount: reviews?.count ?? null,
  };
}
