let strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Permite override de backend solo en desarrollo (evita desync home vs SSR en prod/E2E)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  let response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  // Token de otro entorno (ej. prod en .env.local) → reintentar con permisos Public
  if (response.status === 401 && headers.Authorization) {
    const { Authorization: _auth, ...publicHeaders } = headers;
    response = await fetch(url, {
      ...options,
      headers: publicHeaders,
      cache: 'no-store',
    });
  }

  if (!response.ok) throw new Error(`Fetch Error: ${response.statusText}`);
  return response.json();
}

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
