/**
 * Safe internal return URL for post-edit navigation.
 * Rejects open redirects (protocol-relative, absolute external URLs).
 */
export function safeReturnTo(
  raw: string | null | undefined,
  fallback = "/portal"
): string {
  if (!raw || typeof raw !== "string") return fallback;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  const trimmed = decoded.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }

  return trimmed;
}

/** Build edit URL preserving the caller's search/list context. */
export function buildBusinessEditHref(slug: string, returnTo?: string | null): string {
  const base = `/portal/negocios/${slug}/editar`;
  if (!returnTo) return base;
  const safe = safeReturnTo(returnTo, "");
  if (!safe) return base;
  return `${base}?returnTo=${encodeURIComponent(safe)}`;
}

export function returnToLabel(returnTo: string): string {
  if (returnTo === "/portal" || returnTo.startsWith("/portal")) {
    return "Volver al Portal";
  }
  return "Volver a la búsqueda";
}
