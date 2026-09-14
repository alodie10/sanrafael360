import { ForbiddenError } from './errors';
import { userHasAdminAccess } from './admin-access';

type AclUser = {
  id?: number;
  email?: string;
  role?: { name?: string; type?: string };
};

type AclNegocio = {
  owner?: { id?: number } | null;
  estado_reclamo?: string | null;
};

export function isAdminUser(user: AclUser | null | undefined): boolean {
  if (!user) return false;
  const roleName = user.role?.name?.toLowerCase();
  const roleType = user.role?.type?.toLowerCase();
  if (roleType === 'admin' || roleType === 'superadmin') return true;
  return userHasAdminAccess(user);
}

export function isNegocioOwner(user: AclUser | null | undefined, negocio: AclNegocio): boolean {
  return Boolean(user?.id && negocio.owner?.id === user.id);
}

/** Owner o admin. No alcanza el rol authenticated. */
export function assertOwnsNegocio(user: AclUser | null | undefined, negocio: AclNegocio): void {
  if (isAdminUser(user) || isNegocioOwner(user, negocio)) return;
  throw new ForbiddenError('No tienes permisos para editar este negocio');
}

/**
 * Escritura pública de ficha / ofertas / premium: dueño aprobado o admin.
 * Un reclamo pendiente no habilita portal-update ni publicar.
 */
export function assertCanPublishListing(
  user: AclUser | null | undefined,
  negocio: AclNegocio
): void {
  assertOwnsNegocio(user, negocio);
  if (isAdminUser(user)) return;
  if (negocio.estado_reclamo === 'pendiente') {
    throw new ForbiddenError('El reclamo debe estar aprobado antes de editar la ficha');
  }
}
