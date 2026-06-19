import { Metadata } from "next";
import { ReactNode } from "react";
import { getNegocioBySlug } from "@/lib/negocios";
import { LocalBusinessSchema } from "@/components/business/LocalBusinessSchema";

const OG_DEFAULT_IMAGE = "https://www.sanrafael360.com/og-default.jpg";
const SITE_URL = "https://www.sanrafael360.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const negocio = await getNegocioBySlug(slug);

    if (!negocio) {
      return { title: "Negocio no encontrado | San Rafael 360" };
    }

    // Título: "Nombre — Categoría | San Rafael 360"
    const title = `${negocio.nombre}${negocio.categoria?.nombre ? ` — ${negocio.categoria.nombre}` : ""} | San Rafael 360`;

    // Descripción: limpia de markdown/HTML, máx 155 chars
    const rawDesc = negocio.descripcion
      ? negocio.descripcion
          .replace(/<[^>]*>/g, "")
          .replace(/[#*_~`>]/g, "")
          .trim()
      : "";
    const description =
      rawDesc.length > 10
        ? rawDesc.substring(0, 152) + "..."
        : `Descubrí ${negocio.nombre} en San Rafael, Mendoza. Dirección, horarios, fotos y contacto directo en el portal más completo de la ciudad.`;

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
    console.error(
      `[SEO Critical Error] generateMetadata para ${slug}:`,
      e.message || e
    );
    return { title: "San Rafael 360" };
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
