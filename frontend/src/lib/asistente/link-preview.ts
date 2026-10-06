import { toCmsCategoriaSlug } from "@/lib/categoria-slug";
import { getCategoriaBySlug } from "@/lib/categorias";
import { fetchEfemeridePublic } from "@/lib/efemerides";
import { getNegocioBySlug } from "@/lib/negocios";
import { excerptText } from "@/lib/asistente/rank";
import { getStrapiMedia } from "@/lib/strapi";
import type { StrapiMedia } from "@/types/strapi";
import { parsePortalPreviewPath, type PortalPreview, type PortalPreviewTarget } from "./message-links";

const IMAGE_HOSTS = new Set(["res.cloudinary.com", "localhost", "127.0.0.1"]);

function plain(value: string | null | undefined, max = 140): string | null {
  if (!value) return null;
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return excerptText(text, max);
}

function mediaUrl(media?: StrapiMedia | null): string | null {
  const absolute = getStrapiMedia(media?.url ?? null);
  if (!absolute) return null;
  try {
    const host = new URL(absolute).hostname.toLowerCase();
    if (IMAGE_HOSTS.has(host) || host.endsWith(".up.railway.app")) return absolute;
  } catch {
    return null;
  }
  return null;
}

async function previewEfemeride(target: PortalPreviewTarget): Promise<PortalPreview | null> {
  const item = await fetchEfemeridePublic(target.slug);
  if (!item) return null;
  return {
    path: target.path,
    title: item.nombre,
    description: plain(item.descripcion),
    imageUrl: mediaUrl(item.encabezado),
    kicker: item.tipo === "feria" ? "Feria" : "Efeméride",
  };
}

async function previewNegocio(target: PortalPreviewTarget): Promise<PortalPreview | null> {
  const negocio = await getNegocioBySlug(target.slug);
  if (!negocio?.nombre) return null;
  const categoria = typeof negocio.categoria === "object" ? negocio.categoria?.nombre : null;
  return {
    path: target.path,
    title: negocio.nombre,
    description: plain(negocio.descripcion),
    imageUrl: mediaUrl(negocio.imagen_portada) || mediaUrl(negocio.logo) || mediaUrl(negocio.galeria?.[0]),
    kicker: categoria || "Ficha",
  };
}

async function previewCategoria(target: PortalPreviewTarget): Promise<PortalPreview | null> {
  const categoria = await getCategoriaBySlug(toCmsCategoriaSlug(target.slug));
  if (!categoria?.nombre) return null;
  return {
    path: target.path,
    title: categoria.nombre,
    description: plain(categoria.descripcion) || `Guía de ${categoria.nombre} en San Rafael.`,
    imageUrl: mediaUrl(categoria.imagen_portada),
    kicker: "Rubro",
  };
}

/** Título, texto e imagen de una ruta propia del portal. Null si no existe. */
export async function resolvePortalPreview(rawPath: string): Promise<PortalPreview | null> {
  const target = parsePortalPreviewPath(rawPath);
  if (!target) return null;
  try {
    if (target.kind === "efemeride") return await previewEfemeride(target);
    if (target.kind === "negocio") return await previewNegocio(target);
    return await previewCategoria(target);
  } catch (error) {
    console.error(`[guide-preview] ${target.path}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
