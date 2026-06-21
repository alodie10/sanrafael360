let strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Permite override de backend en entornos de preview/dev vía query param (?backend=...) o localStorage
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const backendOverride = params.get('backend');
  
  if (backendOverride) {
    strapiUrl = backendOverride.endsWith('/') ? backendOverride.slice(0, -1) : backendOverride;
    localStorage.setItem('STRAPI_BACKEND_OVERRIDE', strapiUrl);
    console.log('--- DEBUG: Backend override activado via URL:', strapiUrl);
  } else {
    const savedOverride = localStorage.getItem('STRAPI_BACKEND_OVERRIDE');
    if (savedOverride) {
      strapiUrl = savedOverride;
      console.log('--- DEBUG: Usando backend guardado en localStorage:', strapiUrl);
    }
  }
}

export const STRAPI_URL = strapiUrl;
console.log('--- DEBUG: Usando STRAPI_URL final:', STRAPI_URL);

export async function fetchFromStrapi(path: string, options: RequestInit = {}) {
  const url = `${STRAPI_URL}/api/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Fetch Error: ${response.statusText}`);
  return response.json();
}

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
