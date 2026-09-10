import { describe, expect, it } from 'vitest';
import {
  PUBLIC_READ_ACTIONS,
  REVOKE_UNTRUSTED_REST_ACTIONS,
} from '../../src/bootstrap/rest-permissions';

describe('rest-permissions (AppSec)', () => {
  it('revoca find de pagos y leads en roles no admin', () => {
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::pago.pago.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::pago.pago.findOne');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::lead.lead.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::lead.lead.findOne');
  });

  it('no vuelve a otorgar pagos ni leads en el set público', () => {
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::pago.pago.find');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::lead.lead.find');
  });
});
