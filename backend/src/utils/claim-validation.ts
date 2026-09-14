import { NotFoundError, ValidationError } from './errors';

interface ClaimableNegocio {
  owner?: unknown;
  estado_reclamo?: string;
  reclamar_habilitado?: boolean | null;
}

/** Valida que un negocio pueda recibir un nuevo reclamo de propiedad. */
export function assertNegocioClaimable<T extends ClaimableNegocio>(
  negocio: T | null
): asserts negocio is T {
  if (!negocio) throw new NotFoundError('Negocio');
  if (!negocio.reclamar_habilitado) {
    throw new ValidationError('Este negocio no está habilitado para reclamos');
  }
  if (negocio.owner && negocio.estado_reclamo !== 'ninguno') {
    throw new ValidationError('El negocio ya tiene un reclamo activo');
  }
}
