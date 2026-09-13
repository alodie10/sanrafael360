import { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { getNegocioBySlug } from "@/lib/negocios";
import { LocalBusinessSchema } from "@/components/business/LocalBusinessSchema";
import { getSiteUrl } from "@/lib/site";
import { showsPublicFicha } from "@/lib/search-match";

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

    const premium = showsPublicFicha(negocio);
    const title = premium
      ? `${negocio.nombre} en San Rafael: Opiniones, Horarios y Contacto | SR360`
      : `${negocio.nombre} — Directorio San Rafael 360`;
    const description = premium
      ? `Todo sobre ${negocio.nombre} en San Rafael, Mendoza. ✅ Conocé opiniones reales, fotos, horarios actualizados, teléfono y ubicación en el directorio más completo.`
      : `${negocio.nombre}${negocio.categoria?.nombre ? ` · ${negocio.categoria.nombre}` : ""}${negocio.direccion ? ` · ${negocio.direccion}` : ""}`;
    const ogImageUrl = premium
      ? negocio.imagen_portada?.url || negocio.logo?.url || OG_DEFAULT_IMAGE
      : OG_DEFAULT_IMAGE;
    const canonicalUrl = `${SITE_URL}/negocios/${negocio.slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: premium
        ? { index: true, follow: true }
        : { index: false, follow: false },
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
  children: React.ReactNode;
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
      {negocio && showsPublicFicha(negocio) ? (
        <LocalBusinessSchema negocio={negocio} />
      ) : null}
      {children}
    </>
  );
}
