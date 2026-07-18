import { MetadataRoute } from "next";
import { fetchFromStrapi } from "@/lib/strapi";
import { getSiteUrl } from "@/lib/site";

/** Forzar render dinámico: evita warnings de build cuando Strapi no está levantado. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  let negocios: any[] = [];

  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};

    // Traemos slug, updatedAt, is_premium y campos de calidad de contenido
    const res = await fetchFromStrapi(
      "negocios?fields[0]=slug&fields[1]=updatedAt&fields[2]=is_premium&fields[3]=premium_valid_until&fields[4]=descripcion&populate[imagen_portada][fields][0]=url&pagination[pageSize]=1000",
      options
    );
    negocios = res.data || [];
  } catch (error) {
    console.error(
      "[Sitemap Error] Falló la obtención de negocios desde Strapi:",
      error
    );
  }

  const isPremiumActive = (n: any): boolean => {
    if (!n.is_premium) return false;
    if (!n.premium_valid_until) return true;
    return new Date(n.premium_valid_until) > new Date();
  };

  // Solo incluir en el sitemap negocios con contenido mínimo:
  // descripción >= 30 caracteres O imagen de portada cargada.
  // Evita que Google indexe páginas vacías que consumen crawl budget.
  const hasMinimumContent = (n: any): boolean => {
    const hasDescription =
      typeof n.descripcion === "string" && n.descripcion.trim().length >= 30;
    const hasImage = !!n.imagen_portada?.url;
    return hasDescription || hasImage;
  };

  const negocioUrls: MetadataRoute.Sitemap = negocios
    .filter((n: any) => n.slug && hasMinimumContent(n))
    .map((n: any) => ({
      url: `${siteUrl}/negocios/${n.slug}`,
      lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      // Los negocios premium tienen prioridad levemente mayor → Google los recrawlea antes
      priority: isPremiumActive(n) ? 0.9 : 0.8,
    }));

  let categorias: any[] = [];
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};
    const catRes = await fetchFromStrapi(
      "categorias?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=100",
      options
    );
    categorias = catRes.data || [];
  } catch (error) {
    console.error(
      "[Sitemap Error] Falló la obtención de categorías desde Strapi:",
      error
    );
  }

  const isPlaceholderCategoriaSlug = (slug: string) =>
    slug === "categoria" || /^categoria-\d+$/.test(slug);

  const categoriaUrls: MetadataRoute.Sitemap = categorias
    .filter((c: any) => c.slug && !isPlaceholderCategoriaSlug(c.slug))
    .map((c: any) => ({
      url: `${siteUrl}/categoria/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9, // Las categorías son páginas de aterrizaje importantes
    }));

  // FIX SEO: El home no cambia a diario. Usar new Date() siempre causa que
  // Google vea el sitemap como "siempre actualizado" lo que puede reducir la
  // credibilidad de la señal lastModified. Usamos una fecha fija + revisión semanal.
  const BUILD_DATE = new Date("2025-07-01T00:00:00Z");

  return [
    {
      url: siteUrl,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    // NOTA: /negocios no se incluye porque next.config.ts tiene un redirect 301 → /
    // Incluirla causaría una señal SEO contradictoria para Google.
    ...categoriaUrls,
    ...negocioUrls,
  ];
}
