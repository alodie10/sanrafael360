import { NotFoundError, ValidationError } from './errors';

interface ClaimableNegocio {
  owner?: unknown;
  estado_reclamo?: string;
}

/** Valida que un negocio pueda recibir un nuevo reclamo de propiedad. */
export function assertNegocioClaimable(
  negocio: ClaimableNegocio | null
): asserts negocio is ClaimableNegocio {
  if (!negocio) throw new NotFoundError('Negocio');
  if (negocio.owner && negocio.estado_reclamo !== 'ninguno') {
    throw new ValidationError('El negocio ya tiene un reclamo activo');
  }
}
