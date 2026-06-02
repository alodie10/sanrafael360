import { Metadata } from "next";
import { ReactNode } from "react";
import { getNegocioBySlug } from "@/lib/negocios";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const negocio = await getNegocioBySlug(slug);

    if (!negocio) {
      console.warn(`[SEO Warning] Negocio no encontrado después de intentar por slug/documentId: ${slug}`);
      return { title: "Negocio no encontrado | San Rafael 360" };
    }

    const title = `${negocio.nombre} | ${negocio.categoria?.nombre || 'San Rafael'} | San Rafael 360`;
    const description = negocio.descripcion 
      ? negocio.descripcion.substring(0, 160).replace(/[#*]/g, '') 
      : `Descubre ${negocio.nombre} en San Rafael. Dirección, horarios, fotos y contacto directo en el portal más completo de la ciudad.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: negocio.imagen_portada?.url ? [{ url: negocio.imagen_portada.url }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: `https://www.sanrafael360.com/negocios/${negocio.slug}`,
      }
    };
  } catch (e: any) {
    console.error(`[SEO Critical Error] Error en generateMetadata para ${slug}:`, e.message || e);
    return { title: "San Rafael 360" };
  }
}

export default async function BusinessLayout({ children, params }: { children: ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let jsonLd = null;
  try {
    const negocio = await getNegocioBySlug(slug);
    
    if (negocio) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": negocio.nombre,
        "description": negocio.descripcion?.replace(/[#*]/g, ''),
        "image": negocio.imagen_portada?.url || negocio.logo?.url,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": negocio.direccion,
          "addressLocality": "San Rafael",
          "addressRegion": "Mendoza",
          "addressCountry": "AR"
        },
        "geo": negocio.latitud && negocio.longitud ? {
          "@type": "GeoCoordinates",
          "latitude": negocio.latitud,
          "longitude": negocio.longitud
        } : undefined,
        "telephone": negocio.telefono || negocio.whatsapp,
        "url": `https://www.sanrafael360.com/negocios/${negocio.slug}`,
        "priceRange": negocio.price_range === "Economico" ? "$" : negocio.price_range === "Moderado" ? "$$" : "$$$",
        "aggregateRating": (negocio.rating && negocio.review_count && negocio.review_count > 0) ? {
          "@type": "AggregateRating",
          "ratingValue": negocio.rating,
          "reviewCount": negocio.review_count
        } : undefined,
        "openingHoursSpecification": negocio.schedules?.map((s: any) => ({
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": s.day,
          "opens": s.opening_time,
          "closes": s.closing_time
        }))
      };
    }
  } catch (e: any) {
    console.error(`[SEO Layout Error] Error generando JSON-LD para ${slug}:`, e.message || e);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

