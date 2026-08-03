import { describe, it, expect } from 'vitest';
import {
  buildMpWebhookManifest,
  computeMpWebhookSignature,
  normalizeMpWebhookTsMs,
  verifyMpWebhookSignature,
} from '../../src/utils/mercadopago-webhook-signature';

describe('Mercado Pago webhook signature', () => {
  const secret = 'test-webhook-secret';

  it('builds manifest with all parts lowercase id', () => {
    const manifest = buildMpWebhookManifest('ORD01ABC', 'req-123', '1704908010000');
    expect(manifest).toBe('id:ord01abc;request-id:req-123;ts:1704908010000;');
  });

  it('omits missing manifest fields per MP spec', () => {
    expect(buildMpWebhookManifest(undefined, 'req-1', '999')).toBe('request-id:req-1;ts:999;');
    expect(buildMpWebhookManifest('42', undefined, '999')).toBe('id:42;ts:999;');
  });

  it('verifies a valid HMAC signature', () => {
    const ts = String(Date.now());
    const dataId = '123456789';
    const xRequestId = 'test-request-id';
    const manifest = buildMpWebhookManifest(dataId, xRequestId, ts);
    const v1 = computeMpWebhookSignature(manifest, secret);
    const xSignature = `ts=${ts},v1=${v1}`;

    const result = verifyMpWebhookSignature({
      dataId,
      xRequestId,
      xSignature,
      secret,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects tampered signature', () => {
    const ts = String(Date.now());
    const manifest = buildMpWebhookManifest('999', 'req', ts);
    const v1 = computeMpWebhookSignature(manifest, secret);
    const xSignature = `ts=${ts},v1=${'0'.repeat(v1.length)}`;

    const result = verifyMpWebhookSignature({
      dataId: '999',
      xRequestId: 'req',
      xSignature,
      secret,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('no coincide');
    }
  });

  it('rejects expired notifications', () => {
    const ts = String(Date.now() - 10 * 60 * 1000);
    const manifest = buildMpWebhookManifest('1', 'req', ts);
    const v1 = computeMpWebhookSignature(manifest, secret);

    const result = verifyMpWebhookSignature({
      dataId: '1',
      xRequestId: 'req',
      xSignature: `ts=${ts},v1=${v1}`,
      secret,
      maxAgeMs: 60_000,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('expirada');
    }
  });

  it('normalizes second-based ts from MP examples', () => {
    expect(normalizeMpWebhookTsMs(1704908010)).toBe(1704908010_000);
    expect(normalizeMpWebhookTsMs(1742505638683)).toBe(1742505638683);
  });

  it('accepts valid signature when ts is in seconds', () => {
    const tsSec = String(Math.floor(Date.now() / 1000));
    const dataId = '170989657925';
    const xRequestId = 'req-seconds';
    const manifest = buildMpWebhookManifest(dataId, xRequestId, tsSec);
    const v1 = computeMpWebhookSignature(manifest, secret);

    const result = verifyMpWebhookSignature({
      dataId,
      xRequestId,
      xSignature: `ts=${tsSec},v1=${v1}`,
      secret,
    });

    expect(result.valid).toBe(true);
  });
});
