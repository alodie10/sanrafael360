import { describe, it, expect } from 'vitest';
import { assertNegocioClaimable } from '../../src/utils/claim-validation';
import { NotFoundError, ValidationError } from '../../src/utils/errors';

describe('claim-validation utils', () => {
  it('throws NotFoundError when negocio is null', () => {
    expect(() => assertNegocioClaimable(null)).toThrow(NotFoundError);
  });

  it('allows claim when negocio has no owner', () => {
    expect(() => assertNegocioClaimable({ estado_reclamo: 'ninguno' })).not.toThrow();
  });

  it('allows claim when owner exists but estado is ninguno', () => {
    expect(() =>
      assertNegocioClaimable({ owner: { id: 1 }, estado_reclamo: 'ninguno' })
    ).not.toThrow();
  });

  it('throws ValidationError when owner exists and claim is active', () => {
    expect(() =>
      assertNegocioClaimable({ owner: { id: 1 }, estado_reclamo: 'pendiente' })
    ).toThrow(ValidationError);
  });
});
