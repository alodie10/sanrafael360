let strapiUrl = normalizeStrapiBaseUrl(
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337"
);

// Permite override de backend solo en desarrollo (evita desync home vs SSR en prod/E2E)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const params = new URLSearchParams(window.location.search);
  const backendOverride = params.get("backend");

  if (backendOverride) {
    strapiUrl = normalizeStrapiBaseUrl(
      backendOverride.endsWith("/") ? backendOverride.slice(0, -1) : backendOverride
    );
    localStorage.setItem("STRAPI_BACKEND_OVERRIDE", strapiUrl);
  } else {
    const savedOverride = localStorage.getItem("STRAPI_BACKEND_OVERRIDE");
    if (savedOverride) {
      strapiUrl = normalizeStrapiBaseUrl(savedOverride);
    }
  }
}

export const STRAPI_URL = strapiUrl;

/** Evita ECONNREFUSED por localhost resolviendo a ::1 mientras Strapi escucha en IPv4. */
export function normalizeStrapiBaseUrl(url: string): string {
  return url.replace(/\/$/, "").replace("://localhost", "://127.0.0.1");
}

/** URL base de Strapi sin override de desarrollo (server / env). */
export function getStrapiUrl(): string {
  return normalizeStrapiBaseUrl(
    process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337"
  );
}

export class StrapiUnreachableError extends Error {
  constructor(baseUrl: string, cause?: unknown) {
    super(`Strapi unreachable at ${baseUrl}`);
    this.name = "StrapiUnreachableError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function isStrapiUnreachableError(error: unknown): boolean {
  return error instanceof StrapiUnreachableError;
}

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

async function fetchStrapiUrl(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (url.includes("://localhost")) {
      const ipv4Url = url.replace("://localhost", "://127.0.0.1");
      try {
        return await fetch(ipv4Url, init);
      } catch (retryError) {
        throw new StrapiUnreachableError(STRAPI_URL, retryError);
      }
    }
    throw new StrapiUnreachableError(STRAPI_URL, error);
  }
}

export async function fetchFromStrapi(path: string, options: RequestInit = {}) {
  const url = `${STRAPI_URL}/api/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const init = buildFetchInit(options, headers);
  let response = await fetchStrapiUrl(url, init);

  if (response.status === 401 && headers.Authorization) {
    const { Authorization: _auth, ...publicHeaders } = headers;
    response = await fetchStrapiUrl(url, buildFetchInit(options, publicHeaders));
  }

  if (!response.ok) throw new Error(`Fetch Error: ${response.statusText}`);
  return response.json();
}

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}
