import { getStrapiMedia } from "@/lib/strapi";
import { sortGaleriaByOrden } from "@/lib/galeria-order";
import { Negocio } from "@/types/strapi";

/** Fotos extra de galería visibles en ficha básica (además de la portada). */
export const BASIC_HERO_GALLERY_LIMIT = 2;

export type HeroCarouselImage = {
  url: string;
  cropGravity: string;
  rotation: number;
};

function isVideoMedia(img: { mime?: string; url?: string }) {
  return Boolean(
    img.mime?.startsWith("video/") || img.url?.match(/\.(mp4|m4v|webm|ogg|mov)$/i)
  );
}

function readGalleryItemConfig(negocio: Negocio, img: { id?: number | string }) {
  const config = img.id != null ? negocio.galeria_config?.[img.id] : undefined;
  let cropGravity = negocio.crop_gravity || "g_auto";
  let isInternal = false;
  let rotation = 0;

  if (typeof config === "string") {
    cropGravity = config;
  } else if (config) {
    cropGravity = config.cropGravity || cropGravity;
    isInternal = config.isInternal === true;
    rotation = config.rotation || 0;
  }

  return { cropGravity, isInternal, rotation };
}

export function buildHeroCarouselImages(
  negocio: Negocio,
  isValidPremium: boolean
): HeroCarouselImage[] {
  const images: HeroCarouselImage[] = [];
  const seen = new Set<string>();
  const coverUrl = negocio.imagen_portada?.url;

  if (coverUrl) {
    const url = getStrapiMedia(coverUrl);
    if (url) {
      images.push({
        url,
        cropGravity: negocio.crop_gravity || "g_auto",
        rotation: 0,
      });
      seen.add(url);
    }
  }

  const publicPhotos: HeroCarouselImage[] = [];
  for (const img of sortGaleriaByOrden(negocio.galeria || [], negocio.galeria_config)) {
    if (!img.url || isVideoMedia(img)) continue;
    const { cropGravity, isInternal, rotation } = readGalleryItemConfig(negocio, img);
    if (isInternal) continue;
    const url = getStrapiMedia(img.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    publicPhotos.push({ url, cropGravity, rotation });
  }

  const visible = isValidPremium
    ? publicPhotos
    : publicPhotos.slice(0, BASIC_HERO_GALLERY_LIMIT);

  images.push(...visible);
  return images;
}
