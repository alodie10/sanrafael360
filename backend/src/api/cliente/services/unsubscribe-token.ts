import crypto from 'crypto';

function unsubscribeSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    'dev-unsubscribe-secret'
  );
}

export function createUnsubscribeToken(documentId: string): string {
  const id = documentId.trim();
  const sig = crypto
    .createHmac('sha256', unsubscribeSecret())
    .update(id)
    .digest('base64url');
  return `${id}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const lastDot = token.lastIndexOf('.');
  const documentId = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!documentId || !sig) return null;

  const expected = crypto
    .createHmac('sha256', unsubscribeSecret())
    .update(documentId)
    .digest('base64url');

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return documentId;
}

export function frontendBaseUrl(): string {
  const raw = (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : 'https://www.sanrafael360.com')
  )
    .trim()
    .replace(/^["'=]+|["']+$/g, '')
    .replace(/\/$/, '');

  return raw || 'http://localhost:3000';
}

export function buildUnsubscribeUrl(documentId: string): string {
  const token = createUnsubscribeToken(documentId);
  return `${frontendBaseUrl()}/baja?token=${encodeURIComponent(token)}`;
}
