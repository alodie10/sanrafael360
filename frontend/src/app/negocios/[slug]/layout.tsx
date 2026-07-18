import { Metadata } from "next";
import { ReactNode } from "react";
import { notFound, unstable_rethrow } from "next/navigation";
import { getNegocioBySlug } from "@/lib/negocios";
import { LocalBusinessSchema } from "@/components/business/LocalBusinessSchema";
import { getSiteUrl } from "@/lib/site";

const SITE_URL = getSiteUrl();
const OG_DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const negocio = await getNegocioBySlug(slug);

    if (!negocio) {
      notFound();
    }

    // Título optimizado para CTR local (Intención de búsqueda)
    const title = `${negocio.nombre} en San Rafael: Opiniones, Horarios y Contacto | SR360`;

    // Descripción optimizada para CTR con Call to Action fuerte
    const description = `Todo sobre ${negocio.nombre} en San Rafael, Mendoza. ✅ Conocé opiniones reales, fotos, horarios actualizados, teléfono y ubicación en el directorio más completo.`;

    // Imagen para Open Graph — con dimensiones explícitas para redes
    const ogImageUrl =
      negocio.imagen_portada?.url || negocio.logo?.url || OG_DEFAULT_IMAGE;

    const canonicalUrl = `${SITE_URL}/negocios/${negocio.slug}`;

    // Lógica para prevenir indexación de contenido pobre (igual que en sitemap.ts)
    const hasDescription =
      typeof negocio.descripcion === "string" && negocio.descripcion.trim().length >= 30;
    const hasImage = !!negocio.imagen_portada?.url;
    const hasMinimumContent = hasDescription || hasImage;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: hasMinimumContent
        ? { index: true, follow: true }
        : { index: false, follow: true }, // Evita indexar perfiles casi vacíos
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "San Rafael 360",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${negocio.nombre} — San Rafael 360`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
        site: "@sanrafael360",
      },
    };
  } catch (e: any) {
    unstable_rethrow(e);
    console.error(
      `[SEO Critical Error] generateMetadata para ${slug}:`,
      e.message || e
    );
    return { title: "San Rafael 360", robots: { index: false, follow: true } };
  }
}

export default async function BusinessLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let negocio = null;
  try {
    negocio = await getNegocioBySlug(slug);
  } catch (e: any) {
    console.error(`[SEO Layout Error] getNegocioBySlug falló para ${slug}:`, e.message || e);
  }

  return (
    <>
      {negocio && <LocalBusinessSchema negocio={negocio} />}
      {children}
    </>
  );
}
