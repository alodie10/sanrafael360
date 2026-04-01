export const STRAPI_URL = 'https://sanrafael360-production.up.railway.app';
console.log('--- DEBUG: Usando STRAPI_URL (FORZADO):', STRAPI_URL);

export async function fetchFromStrapi(path: string, options: RequestInit = {}) {
  const url = `${STRAPI_URL}/api/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) throw new Error(`Fetch Error: ${response.statusText}`);
  return response.json();
}

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
