let strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Permite override de backend solo en desarrollo (evita desync home vs SSR en prod/E2E)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const params = new URLSearchParams(window.location.search);
  const backendOverride = params.get('backend');
  
  if (backendOverride) {
    strapiUrl = backendOverride.endsWith('/') ? backendOverride.slice(0, -1) : backendOverride;
    localStorage.setItem('STRAPI_BACKEND_OVERRIDE', strapiUrl);
  } else {
    const savedOverride = localStorage.getItem('STRAPI_BACKEND_OVERRIDE');
    if (savedOverride) {
      strapiUrl = savedOverride;
    }
  }
}

export const STRAPI_URL = strapiUrl;

function buildFetchInit(
  options: RequestInit,
  headers: Record<string, string>
): RequestInit {
  const { headers: _ignored, ...rest } = options;
  const init: RequestInit = { ...rest, headers };

  const hasCacheControl =
    init.cache !== undefined ||
    (init as RequestInit & { next?: { revalidate?: number } }).next !== undefined;

  if (!hasCacheControl) {
    init.cache = "no-store";
  }

  return init;
}

export async function fetchFromStrapi(path: string, options: RequestInit = {}) {
  const url = `${STRAPI_URL}/api/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  let response = await fetch(url, buildFetchInit(options, headers));

  // Token de otro entorno (ej. prod en .env.local) → reintentar con permisos Public
  if (response.status === 401 && headers.Authorization) {
    const { Authorization: _auth, ...publicHeaders } = headers;
    response = await fetch(url, buildFetchInit(options, publicHeaders));
  }

  if (!response.ok) throw new Error(`Fetch Error: ${response.statusText}`);
  return response.json();
}

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
