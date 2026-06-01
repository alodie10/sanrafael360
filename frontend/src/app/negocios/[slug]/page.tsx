import { notFound } from "next/navigation";
import BusinessDetailClient from "./BusinessDetailClient";

export default async function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
  const strapiToken = process.env.STRAPI_API_TOKEN;
  
  const fetchOptions = {
    headers: {
      ...(strapiToken ? { Authorization: `Bearer ${strapiToken}` } : {})
    },
    next: { revalidate: 60 } // Cache de 1 minuto para SEO
  };
  
  const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo&populate[logo][fields][0]=url&populate[imagen_portada][fields][1]=url&populate[galeria][fields][0]=url&populate[schedules]=*&populate[owner][fields][0]=id&fields[0]=nombre&fields[1]=descripcion&fields[2]=direccion&fields[3]=telefono&fields[4]=whatsapp&fields[5]=website&fields[6]=instagram&fields[7]=facebook&fields[8]=latitud&fields[9]=longitud&fields[10]=verificado&fields[11]=reclamar_habilitado&fields[12]=reserva_url&fields[13]=reserva_habilitada&fields[14]=rating&fields[15]=review_count&fields[16]=is_premium&fields[17]=premium_valid_until";
  
  let negocio = null;
  try {
    let res = await fetch(`${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&${populate}`, fetchOptions);
    if (!res.ok) {
      console.error(`[Business Detail Server] Failed fetching by slug. Status: ${res.status}`);
    }
    let data = await res.json();
    negocio = data.data?.[0];
    
    // Plan B: Buscar por documentId
    if (!negocio) {
      res = await fetch(`${strapiUrl}/api/negocios?filters[documentId][$eq]=${slug}&${populate}`, fetchOptions);
      if (!res.ok) {
        console.error(`[Business Detail Server] Failed fetching by documentId. Status: ${res.status}`);
      }
      data = await res.json();
      negocio = data.data?.[0];
    }
  } catch (error) {
    console.error(`[Business Detail Server Error] Error fetching data for ${slug}:`, error);
  }

  if (!negocio) {
    notFound();
  }

  return <BusinessDetailClient initialNegocio={negocio} slug={slug} />;
}
