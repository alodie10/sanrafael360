/** IP del cliente detrás de Railway/Vercel: no usar el primer X-Forwarded-For (spoofable). */
export function clientIpFromHeaders(
  headers: Record<string, unknown>,
  fallback = 'unknown'
): string {
  const pick = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return '';
  };

  const vercel = pick(headers['x-vercel-forwarded-for']).split(',')[0].trim();
  if (vercel) return vercel;

  const real = pick(headers['x-real-ip']).trim();
  if (real) return real;

  const forwarded = pick(headers['x-forwarded-for'])
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length) return forwarded[forwarded.length - 1];

  return fallback;
}

export function clientIpFromKoa(ctx: {
  request?: { header?: Record<string, unknown>; headers?: Record<string, unknown>; ip?: string };
}): string {
  const headers = ctx.request?.header || ctx.request?.headers || {};
  return clientIpFromHeaders(headers, ctx.request?.ip || 'unknown');
}
