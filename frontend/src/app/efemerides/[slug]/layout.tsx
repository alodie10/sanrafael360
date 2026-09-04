import { Metadata } from "next";
import { ReactNode } from "react";
import { notFound, unstable_rethrow } from "next/navigation";
import { fetchEfemeridePublic } from "@/lib/efemerides";
import { getSiteUrl } from "@/lib/site";

const SITE_URL = getSiteUrl();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const efemeride = await fetchEfemeridePublic(slug);
    if (!efemeride) notFound();

    const title = `${efemeride.nombre} en San Rafael | SR360`;
    const description =
      efemeride.descripcion ||
      `Descubrí los comercios de San Rafael que participan de ${efemeride.nombre}. Ofertas y fichas en un solo lugar.`;
    const canonicalUrl = `${SITE_URL}/efemerides/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "San Rafael 360",
        locale: "es_AR",
        type: "website",
      },
    };
  } catch (e: any) {
    unstable_rethrow(e);
    return { title: "San Rafael 360", robots: { index: false, follow: true } };
  }
}

export default async function EfemerideLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let efemeride = null;
  try {
    efemeride = await fetchEfemeridePublic(slug);
  } catch (e: any) {
    console.error(`[SEO Layout Error] efeméride ${slug}:`, e.message || e);
  }

  const schema = efemeride
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${efemeride.nombre} en San Rafael`,
        description:
          efemeride.descripcion ||
          `Directorio temporal de ${efemeride.nombre} en San Rafael, Mendoza.`,
        url: `${SITE_URL}/efemerides/${slug}`,
      }
    : null;

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
