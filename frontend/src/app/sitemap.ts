import { MetadataRoute } from 'next';
import { fetchFromStrapi } from '@/lib/strapi';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let negocios = [];
  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};

    const res = await fetchFromStrapi('negocios?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=1000', options);
    negocios = res.data || [];
  } catch (error) {
    console.error('[Sitemap Error] Falló la obtención de negocios desde Strapi:', error);
  }

  const negocioUrls = negocios
    .filter((n: any) => n.slug)
    .map((n: any) => ({
      url: `https://sanrafael360.com/negocios/${n.slug}`,
      lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    {
      url: 'https://sanrafael360.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://sanrafael360.com/negocios',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...negocioUrls,
  ];
}
