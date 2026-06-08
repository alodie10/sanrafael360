import { MetadataRoute } from "next";
import { fetchFromStrapi } from "@/lib/strapi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let negocios: any[] = [];

  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};

    // Traemos slug, updatedAt y is_premium para diferenciar prioridad
    const res = await fetchFromStrapi(
      "negocios?fields[0]=slug&fields[1]=updatedAt&fields[2]=is_premium&fields[3]=premium_valid_until&pagination[pageSize]=1000",
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

  const negocioUrls: MetadataRoute.Sitemap = negocios
    .filter((n: any) => n.slug)
    .map((n: any) => ({
      url: `https://www.sanrafael360.com/negocios/${n.slug}`,
      lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      // Los negocios premium tienen prioridad levemente mayor → Google los recrawlea antes
      priority: isPremiumActive(n) ? 0.9 : 0.8,
    }));

  return [
    {
      url: "https://www.sanrafael360.com",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: "https://www.sanrafael360.com/negocios",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...negocioUrls,
  ];
}
