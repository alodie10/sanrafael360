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
  // populate[0]=banners junto con populate[negocio] hace que Strapi ignore los banners
  // y la tarjeta caiga a la foto de portada. El anidado sí trae el carrusel.
  return [
    strapiOfertaVigenteFilters(),
    "filters[publishedAt][$notNull]=true",
    "populate[banners][fields][0]=url",
    "populate[banners][fields][1]=width",
    "populate[banners][fields][2]=height",
    "populate[negocio][populate][logo][fields][0]=url",
    "populate[negocio][populate][imagen_portada][fields][0]=url",
    "populate[negocio][populate][categoria][fields][0]=nombre",
    "pagination[pageSize]=100",
    "sort=publishedAt:desc",
  ].join("&");
}

async function fetchActiveOfertas() {
  return fetchFromStrapi(`ofertas?${ofertasPopulateQuery()}`);
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
