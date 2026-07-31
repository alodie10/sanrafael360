import crypto from 'crypto';

function cancelSecret(): string {
  return (
    process.env.RESERVA_CANCEL_SECRET ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    'dev-reserva-cancel-secret'
  );
}

/** Token firmado: documentId.sig — para link de cancelación en el mail. */
export function createReservaCancelToken(documentId: string): string {
  const id = documentId.trim();
  const sig = crypto.createHmac('sha256', cancelSecret()).update(id).digest('base64url');
  return `${id}.${sig}`;
}

export function verifyReservaCancelToken(token: string): string | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const lastDot = token.lastIndexOf('.');
  const documentId = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!documentId || !sig) return null;

  const expected = crypto
    .createHmac('sha256', cancelSecret())
    .update(documentId)
    .digest('base64url');

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return documentId;
}

export function frontendBaseUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV !== 'production'
      ? 'http://localhost:3000'
      : 'https://www.sanrafael360.com')
  )
    .trim()
    .replace(/\/$/, '');
}

export function buildReservaCancelUrl(documentId: string, slug: string): string {
  const token = createReservaCancelToken(documentId);
  return `${frontendBaseUrl()}/reservas/${encodeURIComponent(slug)}/cancelar?token=${encodeURIComponent(token)}`;
}
