/** IP del cliente detrás de Vercel/Railway: no usar el primer X-Forwarded-For (spoofable). */
export function clientIpFromHeaders(
  headers: Record<string, unknown> | Headers,
  fallback = "unknown"
): string {
  const get = (name: string): string => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name) || "";
    }
    const rec = headers as Record<string, unknown>;
    const raw = rec[name] ?? rec[name.toLowerCase()];
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
    return "";
  };

  const vercel = get("x-vercel-forwarded-for").split(",")[0].trim();
  if (vercel) return vercel;

  const real = get("x-real-ip").trim();
  if (real) return real;

  const forwarded = get("x-forwarded-for")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length) return forwarded[forwarded.length - 1];

  return fallback;
}
