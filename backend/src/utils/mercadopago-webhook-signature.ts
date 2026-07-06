import crypto from 'crypto';

export type MpWebhookSignatureInput = {
  /** Valor de `data.id` en query o `id` legacy de IPN */
  dataId?: string | null;
  xRequestId?: string | null;
  xSignature?: string | null;
  secret: string;
  /** Tolerancia anti-replay en ms (default 5 min) */
  maxAgeMs?: number;
};

export type MpWebhookSignatureResult =
  | { valid: true; ts: string }
  | { valid: false; reason: string };

function parseXSignature(header: string): { ts?: string; v1?: string } {
  const parts = header.split(',').map((p) => p.trim());
  const out: { ts?: string; v1?: string } = {};
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    const value = rest.join('=');
    if (key === 'ts') out.ts = value;
    if (key === 'v1') out.v1 = value;
  }
  return out;
}

/** Manifest según documentación oficial de Mercado Pago */
export function buildMpWebhookManifest(
  dataId: string | undefined | null,
  xRequestId: string | undefined | null,
  ts: string | undefined | null
): string {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${String(dataId).toLowerCase()}`);
  if (xRequestId) parts.push(`request-id:${xRequestId}`);
  if (ts) parts.push(`ts:${ts}`);
  return parts.length > 0 ? `${parts.join(';')};` : '';
}

export function computeMpWebhookSignature(manifest: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Valida x-signature de notificaciones Webhook / IPN de Mercado Pago.
 * @see https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyMpWebhookSignature(input: MpWebhookSignatureInput): MpWebhookSignatureResult {
  const { dataId, xRequestId, xSignature, secret, maxAgeMs = 5 * 60 * 1000 } = input;

  if (!xSignature) {
    return { valid: false, reason: 'Falta header x-signature' };
  }

  const { ts, v1 } = parseXSignature(xSignature);
  if (!ts || !v1) {
    return { valid: false, reason: 'x-signature inválido (ts o v1 ausente)' };
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return { valid: false, reason: 'Timestamp inválido en x-signature' };
  }

  const age = Math.abs(Date.now() - tsNum);
  if (age > maxAgeMs) {
    return { valid: false, reason: 'Notificación expirada (replay)' };
  }

  const manifest = buildMpWebhookManifest(dataId, xRequestId, ts);
  if (!manifest) {
    return { valid: false, reason: 'No hay datos suficientes para validar la firma' };
  }

  const expected = computeMpWebhookSignature(manifest, secret);
  if (!safeEqualHex(expected, v1)) {
    return { valid: false, reason: 'Firma HMAC no coincide' };
  }

  return { valid: true, ts };
}
