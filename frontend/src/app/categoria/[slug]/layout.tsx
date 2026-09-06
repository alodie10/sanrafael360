import { Metadata } from "next";
import { ReactNode } from "react";
import { notFound, unstable_rethrow } from "next/navigation";
import { fetchFromStrapi } from "@/lib/strapi";
import { getSiteUrl } from "@/lib/site";
import {
  isPlaceholderCategoriaSlug,
  toCmsCategoriaSlug,
  toPublicCategoriaSlug,
} from "@/lib/categoria-slug";

const SITE_URL = getSiteUrl();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cmsSlug = toCmsCategoriaSlug(slug);

  if (isPlaceholderCategoriaSlug(slug) || isPlaceholderCategoriaSlug(cmsSlug)) {
    notFound();
  }

  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
      
    const res = await fetchFromStrapi(`categorias?filters[slug][$eq]=${cmsSlug}&fields[0]=nombre&fields[1]=descripcion`, options);
    const categoria = res.data?.[0];

    if (!categoria) {
      notFound();
    }

    const publicSlug = toPublicCategoriaSlug(cmsSlug);
    const currentYear = new Date().getFullYear();
    const title = `Guía de ${categoria.nombre} en San Rafael, Mza (${currentYear})`;
    const description = `✅ Descubrí lo mejor en ${categoria.nombre.toLowerCase()} en San Rafael, Mendoza. Compará opiniones, mirá fotos, horarios y contactá directo por WhatsApp. La guía más completa del ${currentYear}.`;

    const canonicalUrl = `${SITE_URL}/categoria/${publicSlug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "San Rafael 360",
        locale: "es_AR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        site: "@sanrafael360",
      },
    };
  } catch (e: any) {
    unstable_rethrow(e);
    console.error(
      `[SEO Critical Error] generateMetadata para categoría ${slug}:`,
      e.message || e
    );
    return { title: "San Rafael 360", robots: { index: false, follow: true } };
  }
}

export default async function CategoriaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cmsSlug = toCmsCategoriaSlug(slug);
  const publicSlug = toPublicCategoriaSlug(cmsSlug);

  if (isPlaceholderCategoriaSlug(slug) || isPlaceholderCategoriaSlug(cmsSlug)) {
    notFound();
  }
  
  let categoria = null;
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
    const res = await fetchFromStrapi(`categorias?filters[slug][$eq]=${cmsSlug}&fields[0]=nombre&fields[1]=descripcion`, options);
    categoria = res.data?.[0];
  } catch (e: any) {
    console.error(`[SEO Layout Error] fetch categoría falló para ${slug}:`, e.message || e);
  }

  // Schema.org CollectionPage
  const schema = categoria ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${categoria.nombre} en San Rafael`,
    "description": categoria.descripcion || `Directorio de ${categoria.nombre.toLowerCase()} en San Rafael, Mendoza.`,
    "url": `${SITE_URL}/categoria/${publicSlug}`
  } : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {children}
    </>
  );
}
