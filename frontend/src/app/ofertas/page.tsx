import { fetchFromStrapi } from "@/lib/strapi";
import { Oferta } from "@/types/strapi";
import OfferListClient from "./OfferListClient";
import { canonicalPage } from "@/lib/seo";
import { strapiOfertaVigenteFilters } from "@/lib/oferta-vigencia";

/** Dinámico: evita fallos/warnings de prerender cuando Strapi no responde en build. */
export const dynamic = "force-dynamic";

export const metadata = canonicalPage(
  "/ofertas",
  "Ofertas en San Rafael",
  "Promos vigentes de negocios de San Rafael, Mendoza. Compará descuentos y contactá directo por WhatsApp."
);

function ofertasPopulateQuery() {
  return `${strapiOfertaVigenteFilters()}&filters[publishedAt][$notNull]=true&populate[negocio][populate][0]=logo&populate[negocio][populate][1]=imagen_portada&populate[negocio][populate][2]=categoria&sort=publishedAt:desc`;
}

async function fetchActiveOfertas() {
  const populate = ofertasPopulateQuery();
  try {
    return await fetchFromStrapi(`ofertas?populate[0]=banners&${populate}`);
  } catch {
    return fetchFromStrapi(`ofertas?${populate}`);
  }
}

export default async function OfertasPage() {
  try {
    const res = await fetchActiveOfertas();
    const ofertas = res.data as Oferta[];
    return <OfferListClient initialOfertas={ofertas} />;
  } catch (error) {
    console.error("Error fetching ofertas:", error);
    return <OfferListClient initialOfertas={[]} />;
  }
}
