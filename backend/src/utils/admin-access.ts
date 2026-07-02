import type { Core } from '@strapi/strapi';
import { ForbiddenError } from './errors';

type AuthUser = {
  id: number;
  email?: string;
  role?: { name?: string };
};

/** Lista de emails admin desde env (coma-separados). Sin hardcode en código. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function isAdminRole(roleName?: string | null): boolean {
  const role = roleName?.toLowerCase();
  return role === 'admin' || role === 'super admin';
}

/** Evalúa si un usuario (con role poblado o no) tiene privilegios admin. */
export function userHasAdminAccess(user?: AuthUser | null): boolean {
  if (!user) return false;
  if (isAdminRole(user.role?.name)) return true;
  return isAdminEmail(user.email);
}

/** Carga usuario con role si hace falta para validar admin. */
export async function resolveAdminUser(
  strapi: Core.Strapi,
  user?: AuthUser | null
): Promise<AuthUser | null> {
  if (!user?.id) return null;
  if (user.role?.name) return user;

  const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: user.id },
    populate: ['role'],
  });

  return fullUser as AuthUser | null;
}

export async function assertAdminUser(strapi: Core.Strapi, user?: AuthUser | null): Promise<AuthUser> {
  const fullUser = await resolveAdminUser(strapi, user);
  if (!fullUser || !userHasAdminAccess(fullUser)) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
  return fullUser;
}

