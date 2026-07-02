/** Keys reales de Google suelen tener ~39 caracteres y empezar con AIzaSy */
export function isGoogleMapsApiKeyConfigured(key?: string): boolean {
  if (!key) return false;
  if (key === 'AIza...' || key.includes('...')) return false;
  return key.startsWith('AIza') && key.length >= 30;
}
