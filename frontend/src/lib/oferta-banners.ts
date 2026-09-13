import type { Oferta, StrapiMedia } from "@/types/strapi";
import { getStrapiMedia } from "@/lib/strapi";

export type FormatoVisualOferta = "Ficha" | "Banners";

export function parseFormatoVisual(value: string | undefined): FormatoVisualOferta {
  return value === "Banners" ? "Banners" : "Ficha";
}

export function isGalleryStillImage(item: { mime?: string; url?: string; name?: string } | null | undefined) {
  if (!item) return false;
  const mime = String(item.mime || "").toLowerCase();
  if (mime.startsWith("video/")) return false;
  if (mime.startsWith("image/")) return true;
  const hint = `${item.url || ""} ${item.name || ""}`.toLowerCase();
  return !/\.(mp4|webm|mov|m4v)(\?|\s|$)/.test(hint);
}

export function galleryImageIds(oferta: Oferta) {
  return (oferta.banners || []).map((item) => item.id).filter((id) => Number.isFinite(id));
}

export function isBannerOffer(oferta: Oferta) {
  return parseFormatoVisual(oferta.formato_visual) === "Banners" && (oferta.banners?.length || 0) > 0;
}

export function ofertaBannerSrcs(oferta: Oferta) {
  return (oferta.banners || [])
    .map((item) => getStrapiMedia(item.url))
    .filter((url): url is string => Boolean(url));
}

export function selectableFichaImages(gallery: StrapiMedia[], cover?: StrapiMedia | null) {
  const items: StrapiMedia[] = [];
  if (cover?.id && cover.url && isGalleryStillImage(cover)) items.push(cover);
  for (const item of gallery) {
    if (!item?.id || !item.url || !isGalleryStillImage(item)) continue;
    if (items.some((existing) => existing.id === item.id)) continue;
    items.push(item);
  }
  return items;
}
