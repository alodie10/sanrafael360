import { Metadata } from "next";
import { ReactNode } from "react";
import { fetchFromStrapi } from "@/lib/strapi";

const SITE_URL = "https://www.sanrafael360.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
      
    const res = await fetchFromStrapi(`categorias?filters[slug][$eq]=${slug}&fields[0]=nombre&fields[1]=descripcion`, options);
    const categoria = res.data?.[0];

    if (!categoria) {
      return { title: "Categoría no encontrada | San Rafael 360" };
    }

    const currentYear = new Date().getFullYear();
    const title = `Los Mejores ${categoria.nombre} en San Rafael, Mza (${currentYear}) | SR360`;
    const description = `✅ Descubrí los mejores ${categoria.nombre.toLowerCase()} en San Rafael, Mendoza. Compará opiniones, mirá fotos, horarios y contactá directo por WhatsApp. La guía más completa del ${currentYear}.`;

    const canonicalUrl = `${SITE_URL}/categoria/${slug}`;

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
    console.error(
      `[SEO Critical Error] generateMetadata para categoría ${slug}:`,
      e.message || e
    );
    return { title: "San Rafael 360" };
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
  
  let categoria = null;
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
    const res = await fetchFromStrapi(`categorias?filters[slug][$eq]=${slug}&fields[0]=nombre&fields[1]=descripcion`, options);
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
    "url": `${SITE_URL}/categoria/${slug}`
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
