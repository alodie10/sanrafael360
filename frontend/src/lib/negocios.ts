import { cache } from "react";
import { fetchFromStrapi } from "@/lib/strapi";
import { canUseAlgoliaSearch } from "@/lib/search-config";
import { getNegocioFromAlgoliaBySlug } from "@/lib/search-negocios";
import { Negocio } from "@/types/strapi";

const NEGOCIO_DETAIL_POPULATE =
  "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&" +
  "populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo&" +
  "populate[logo][fields][0]=url&" +
  "populate[imagen_portada][fields][0]=url&" +
  "populate[galeria][fields][0]=url&" +
  "populate[schedules]=*&" +
  "populate[owner][fields][0]=id&" +
  "populate[ofertas]=true&" +
  "populate[reserva_comercio][fields][0]=slug&populate[reserva_comercio][fields][1]=nombre&" +
  "fields[0]=nombre&fields[1]=descripcion&fields[2]=direccion&fields[3]=telefono&" +
  "fields[4]=whatsapp&fields[5]=website&fields[6]=instagram&fields[7]=facebook&" +
  "fields[8]=latitud&fields[9]=longitud&fields[10]=verificado&fields[11]=reclamar_habilitado&" +
  "fields[12]=reserva_url&fields[13]=reserva_habilitada&fields[14]=rating&" +
  "fields[15]=review_count&fields[16]=is_premium&fields[17]=premium_valid_until&" +
  "fields[18]=price_range&fields[19]=google_rating&fields[20]=google_review_count&" +
  "fields[21]=google_place_id&fields[22]=tripadvisor_rating&fields[23]=tripadvisor_review_count&" +
  "fields[24]=tripadvisor_url&fields[25]=youtube_url&" +
  "fields[26]=slug&fields[27]=estado_reclamo&fields[28]=email&" +
  "fields[29]=cta_habilitado&fields[30]=cta_titulo&fields[31]=cta_texto&" +
  "fields[32]=cta_boton_texto&fields[33]=cta_link&fields[34]=cta_tag_confirmacion&fields[35]=cta_tag_sin_comisiones&" +
  "fields[36]=crop_gravity&fields[37]=galeria_config&fields[38]=google_reviews&fields[39]=google_reviews_synced_at";

async function fetchNegocioFromStrapi(slug: string): Promise<Negocio | null> {
  const strapiToken = process.env.STRAPI_API_TOKEN;
  const options: RequestInit = {
    headers: {
      ...(strapiToken ? { Authorization: `Bearer ${strapiToken}` } : {}),
    },
    next: { revalidate: 60 },
  };

  try {
    let res = await fetchFromStrapi(
      `negocios?filters[slug][$eq]=${slug}&${NEGOCIO_DETAIL_POPULATE}`,
      options
    );
    let negocio = res.data?.[0];
    if (!negocio) {
      res = await fetchFromStrapi(
        `negocios?filters[documentId][$eq]=${slug}&${NEGOCIO_DETAIL_POPULATE}`,
        options
      );
      negocio = res.data?.[0];
    }
    return negocio || null;
  } catch (error) {
    console.error(`[getNegocioBySlug Error] Error al obtener el negocio ${slug}:`, error);
    return null;
  }
}

/** Ficha por slug o documentId. Strapi primero; Algolia si no está o el backend no responde. */
export const getNegocioBySlug = cache(async (slug: string): Promise<Negocio | null> => {
  const fromStrapi = await fetchNegocioFromStrapi(slug);
  if (fromStrapi) return fromStrapi;
  if (!canUseAlgoliaSearch()) return null;
  return getNegocioFromAlgoliaBySlug(slug);
});
