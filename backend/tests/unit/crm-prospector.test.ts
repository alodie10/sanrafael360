import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import {
  assertProspectorOwnerEmail,
  isProspectorVigente,
  mapNotaActividades,
  resolveProspectorVigencia,
} from '../../src/api/crm/crm-prospector';

describe('crm-prospector', () => {
  it('mirrors premium vigencia for the Prospector flag', () => {
    const future = new Date();
    future.setDate(future.getDate() + 20);
    const on = resolveProspectorVigencia(future.toISOString().slice(0, 10));
    expect(on.is_prospector).toBe(true);
    expect(on.validUntilISO).not.toBeNull();
    expect(resolveProspectorVigencia(null)).toEqual({ is_prospector: false, validUntilISO: null });
  });

  it('requires an owner email to turn Prospector on', () => {
    expect(() => assertProspectorOwnerEmail({ owner: {} })).toThrow(ValidationError);
    expect(assertProspectorOwnerEmail({ owner: { email: '  Ana@Taller.com ' } })).toBe(
      'ana@taller.com'
    );
  });

  it('treats a future date as vigente', () => {
    expect(isProspectorVigente({ is_prospector: true, prospector_valid_until: '2099-01-01' })).toBe(
      true
    );
    expect(isProspectorVigente({ is_prospector: true, prospector_valid_until: '2020-01-01' })).toBe(
      false
    );
    expect(isProspectorVigente({ is_prospector: false, prospector_valid_until: '2099-01-01' })).toBe(
      false
    );
  });

  it('keeps nota activities as a conversation thread', () => {
    expect(
      mapNotaActividades([
        { tipo: 'envio_whatsapp', texto: 'Hola', createdAt: '2026-09-22T12:00:00.000Z' },
        { tipo: 'nota', texto: 'Pidió precio', createdAt: '2026-09-22T13:00:00.000Z' },
      ])
    ).toEqual([{ texto: 'Pidió precio', createdAt: '2026-09-22T13:00:00.000Z' }]);
  });
});
