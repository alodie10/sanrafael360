import { Loader } from "@googlemaps/js-api-loader";

/** Keys reales de Google suelen tener ~39 caracteres y empezar con AIzaSy */
export function isGoogleMapsApiKeyConfigured(key?: string): boolean {
  if (!key) return false;
  if (key === "AIza..." || key.includes("...")) return false;
  return key.startsWith("AIza") && key.length >= 30;
}

const GOOGLE_MAPS_LIBRARIES = ["places", "marker", "maps"] as const;

let loaderInstance: Loader | null = null;

/**
 * Singleton del Loader de Google Maps.
 * Todos los componentes deben usar esta instancia para evitar:
 * "Loader must not be called again with different options"
 */
export function getGoogleMapsLoader(): Loader | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!isGoogleMapsApiKeyConfigured(apiKey)) return null;

  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: apiKey!,
      version: "weekly",
      libraries: [...GOOGLE_MAPS_LIBRARIES],
      language: "es",
    });
  }

  return loaderInstance;
}

export async function importGoogleMapsLibrary<K extends (typeof GOOGLE_MAPS_LIBRARIES)[number]>(
  library: K
) {
  const loader = getGoogleMapsLoader();
  if (!loader) {
    throw new Error("Google Maps API key no configurada");
  }
  return loader.importLibrary(library);
}
