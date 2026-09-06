import { fetchFromStrapi } from "@/lib/strapi";
import { Oferta } from "@/types/strapi";
import OfferListClient from "./OfferListClient";
import { canonicalPage } from "@/lib/seo";

/** Dinámico: evita fallos/warnings de prerender cuando Strapi no responde en build. */
export const dynamic = "force-dynamic";

export const metadata = canonicalPage(
  "/ofertas",
  "Ofertas en San Rafael",
  "Promos vigentes de negocios de San Rafael, Mendoza. Compará descuentos y contactá directo por WhatsApp."
);

export default async function OfertasPage() {
  try {
    const res = await fetchFromStrapi("ofertas?filters[activa][$eq]=true&filters[publishedAt][$notNull]=true&populate[negocio][populate][0]=logo&populate[negocio][populate][1]=imagen_portada&populate[negocio][populate][2]=categoria&sort=publishedAt:desc");
    const ofertas = res.data as Oferta[];
    return <OfferListClient initialOfertas={ofertas} />;
  } catch (error) {
    console.error("Error fetching ofertas:", error);
    return <OfferListClient initialOfertas={[]} />;
  }
}
