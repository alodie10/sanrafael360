import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { CRM_TENANT_SLUG, plantillaDefaults, type CrmModo } from './crm-defaults';
import type { CrmRepository } from './repositories/crm-repository';

export type CrmActor = {
  isAdmin: boolean;
  email: string;
};

export type CrmPrestamoInput = {
  nombre: string;
  owner_email: string;
  slug?: string;
};

export function normalizeOwnerEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

export function assertValidOwnerEmail(email: unknown): string {
  const value = normalizeOwnerEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ValidationError('email del tercero inválido');
  }
  return value;
}

export function slugFromNombre(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug;
}

export function assertPrestamoSlug(slug: string): string {
  const value = String(slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ValidationError('slug inválido');
  }
  if (value === CRM_TENANT_SLUG) {
    throw new ValidationError('El préstamo no puede usar el tenant de San Rafael 360');
  }
  return value;
}

export function modoOf(comercio: { slug?: string; modo?: string } | null): CrmModo {
  if (comercio?.modo === 'agenda' || comercio?.modo === 'guia') return comercio.modo;
  return comercio?.slug === CRM_TENANT_SLUG ? 'guia' : 'agenda';
}

export function contactoComercioId(contacto: any): string | null {
  const rel = contacto?.comercio;
  if (!rel) return null;
  if (typeof rel === 'string') return rel;
  return rel.documentId || null;
}

export function assertContactoInTenant(contacto: any, tenantDocumentId: string) {
  if (!contacto || contactoComercioId(contacto) !== tenantDocumentId) {
    throw new NotFoundError('Contacto');
  }
}

export function mapTenant(comercio: any) {
  return {
    slug: comercio.slug,
    nombre: comercio.nombre,
    modo: modoOf(comercio),
    owner_email: comercio.owner_email || '',
    activo: comercio.activo !== false,
  };
}

export async function ensurePlantilla(repo: CrmRepository, comercio: any) {
  const existing = await repo.findPlantillaByComercio(comercio.documentId);
  if (existing) return existing;
  const defaults = plantillaDefaults(modoOf(comercio), comercio.nombre);
  return repo.createPlantilla({
    ...defaults,
    comercio: comercio.documentId,
  });
}

export async function ensureGuiaTenant(repo: CrmRepository) {
  let comercio = await repo.findComercioBySlug(CRM_TENANT_SLUG);
  if (!comercio) {
    comercio = await repo.createComercio({
      nombre: 'San Rafael 360',
      slug: CRM_TENANT_SLUG,
      activo: true,
      modo: 'guia',
      cupo_wsp_count: 0,
      cupo_wsp_limite: 25,
    });
  }
  const plantilla = await ensurePlantilla(repo, comercio);
  return { comercio, plantilla };
}

export async function loadTenant(
  repo: CrmRepository,
  actor: CrmActor,
  slug?: string
) {
  if (actor.isAdmin) {
    if (!slug || slug === CRM_TENANT_SLUG) {
      return ensureGuiaTenant(repo);
    }
    const comercio = await repo.findComercioBySlug(slug);
    if (!comercio) {
      throw new NotFoundError('CRM');
    }
    return { comercio, plantilla: await ensurePlantilla(repo, comercio) };
  }

  const email = normalizeOwnerEmail(actor.email);
  if (!email) throw new ForbiddenError('No tenés Captación Prospector');
  const comercio = await repo.findComercioByOwnerEmail(email);
  if (!comercio || comercio.activo === false) {
    throw new ForbiddenError('No tenés Captación Prospector vigente');
  }
  if (slug && slug !== comercio.slug) {
    throw new ForbiddenError('No podés ver ese CRM');
  }
  return { comercio, plantilla: await ensurePlantilla(repo, comercio) };
}

export async function createPrestamo(repo: CrmRepository, input: CrmPrestamoInput) {
  const nombre = String(input.nombre || '').trim();
  if (!nombre) throw new ValidationError('nombre es requerido');
  const owner_email = assertValidOwnerEmail(input.owner_email);
  const slug = assertPrestamoSlug(input.slug?.trim() || slugFromNombre(nombre));
  if (await repo.findComercioBySlug(slug)) {
    throw new ConflictError('Ya existe un CRM con ese slug');
  }
  if (await repo.findComercioByOwnerEmail(owner_email)) {
    throw new ConflictError('Ese email ya tiene un CRM prestado');
  }
  const comercio = await repo.createComercio({
    nombre,
    slug,
    activo: true,
    modo: 'agenda',
    owner_email,
    cupo_wsp_count: 0,
    cupo_wsp_limite: 25,
  });
  await ensurePlantilla(repo, comercio);
  return mapTenant(comercio);
}

export async function pickAgendaSlug(repo: CrmRepository, preferred: string) {
  const base = assertPrestamoSlug(preferred || slugFromNombre('comercio'));
  if (!(await repo.findComercioBySlug(base))) return base;
  for (let i = 2; i < 30; i += 1) {
    const candidate = `${base}-${i}`.slice(0, 40);
    if (!(await repo.findComercioBySlug(candidate))) return candidate;
  }
  throw new ConflictError('No se pudo crear un slug de CRM');
}

export async function syncProspectorTenant(
  repo: CrmRepository,
  negocio: { documentId: string; nombre?: string; slug?: string; owner?: { email?: string } },
  active: boolean
) {
  const rawEmail = normalizeOwnerEmail(negocio.owner?.email);
  if (active && !rawEmail) {
    throw new ValidationError('Asigná un dueño con email al negocio antes de activar Prospector');
  }
  const owner_email = rawEmail;
  let comercio =
    (await repo.findComercioByNegocio(negocio.documentId)) ||
    (owner_email ? await repo.findComercioByOwnerEmail(owner_email) : null);
  if (!comercio) {
    if (!active) return null;
    const email = assertValidOwnerEmail(owner_email);
    const preferred = String(negocio.slug || '').trim() || slugFromNombre(negocio.nombre || 'comercio');
    const slug = await pickAgendaSlug(repo, preferred);
    comercio = await repo.createComercio({
      nombre: String(negocio.nombre || '').trim() || slug,
      slug,
      activo: true,
      modo: 'agenda',
      owner_email: email,
      cupo_wsp_count: 0,
      cupo_wsp_limite: 25,
      negocio: negocio.documentId,
    });
    await ensurePlantilla(repo, comercio);
    return mapTenant(comercio);
  }
  await repo.updateComercio(comercio.documentId, {
    activo: active,
    ...(owner_email ? { owner_email } : {}),
    negocio: negocio.documentId,
  });
  await ensurePlantilla(repo, comercio);
  return mapTenant(comercio);
}
