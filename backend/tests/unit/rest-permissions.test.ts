import { describe, expect, it } from 'vitest';
import {
  AUTHENTICATED_ONLY_ACTIONS,
  PUBLIC_READ_ACTIONS,
  REVOKE_UNTRUSTED_REST_ACTIONS,
} from '../../src/bootstrap/rest-permissions';

describe('rest-permissions (AppSec)', () => {
  it('revoca find de pagos, leads, upload y writes de negocio', () => {
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::pago.pago.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::pago.pago.findOne');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::lead.lead.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::lead.lead.findOne');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::negocio.negocio.update');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::negocio.negocio.create');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::negocio.negocio.delete');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('plugin::upload.content-api.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('plugin::upload.content-api.findOne');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::soporte.soporte.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::soporte.soporte.update');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('plugin::users-permissions.auth.register');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::negocio.negocio.admindelete');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::negocio.negocio.adminlistpagos');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::crm-contacto.crm-contacto.find');
    expect(REVOKE_UNTRUSTED_REST_ACTIONS).toContain('api::crm-comercio.crm-comercio.find');
  });

  it('no vuelve a otorgar dumps sensibles en el set público', () => {
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::pago.pago.find');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::lead.lead.find');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::negocio.negocio.update');
    expect(PUBLIC_READ_ACTIONS).not.toContain('plugin::upload.content-api.find');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::soporte.soporte.find');
  });

  it('oferta create/update y atributo.create solo para autenticados', () => {
    expect(AUTHENTICATED_ONLY_ACTIONS).toContain('api::oferta.oferta.create');
    expect(AUTHENTICATED_ONLY_ACTIONS).toContain('api::oferta.oferta.update');
    expect(AUTHENTICATED_ONLY_ACTIONS).toContain('api::atributo.atributo.create');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::oferta.oferta.create');
    expect(PUBLIC_READ_ACTIONS).not.toContain('api::atributo.atributo.create');
  });
});
