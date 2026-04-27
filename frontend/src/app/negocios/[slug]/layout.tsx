import { Metadata } from "next";
import { ReactNode } from "react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const strapiToken = process.env.STRAPI_API_TOKEN;
  
  const fetchOptions = {
    headers: {
      ...(strapiToken ? { Authorization: `Bearer ${strapiToken}` } : {})
    },
    next: { revalidate: 60 } // Cache de 1 minuto para SEO
  };
  
  try {
    let res = await fetch(`${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&populate[logo]=*&populate[categoria]=*&populate[imagen_portada]=*`, fetchOptions);
    let data = await res.json();
    let negocio = data.data?.[0];
    
    if (!negocio) {
      res = await fetch(`${strapiUrl}/api/negocios?filters[documentId][$eq]=${slug}&populate[logo]=*&populate[categoria]=*&populate[imagen_portada]=*`, fetchOptions);
      data = await res.json();
      negocio = data.data?.[0];
    }

    if (!negocio) return { title: "Negocio no encontrado | San Rafael 360" };

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
      }
    };
  } catch (e) {
    return { title: "San Rafael 360" };
  }
}

export default async function BusinessLayout({ children, params }: { children: ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
  
  const strapiToken = process.env.STRAPI_API_TOKEN;
  const fetchOptions = {
    headers: {
      ...(strapiToken ? { Authorization: `Bearer ${strapiToken}` } : {})
    },
    next: { revalidate: 60 }
  };

  let jsonLd = null;
  try {
    let res = await fetch(`${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&populate[schedules]=*&populate[categoria]=*&populate[imagen_portada]=*&populate[logo]=*`, fetchOptions);
    let data = await res.json();
    let negocio = data.data?.[0];

    if (!negocio) {
      res = await fetch(`${strapiUrl}/api/negocios?filters[documentId][$eq]=${slug}&populate[schedules]=*&populate[categoria]=*&populate[imagen_portada]=*&populate[logo]=*`, fetchOptions);
      data = await res.json();
      negocio = data.data?.[0];
    }
    
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
        "telephone": negocio.telefono,
        "url": `https://sanrafael360.com/negocios/${negocio.slug}`,
        "priceRange": negocio.price_range === "Economico" ? "$" : negocio.price_range === "Moderado" ? "$$" : "$$$",
        "openingHoursSpecification": negocio.schedules?.map((s: any) => ({
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": s.day,
          "opens": s.opening_time,
          "closes": s.closing_time
        }))
      };
    }
  } catch (e) {}

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
