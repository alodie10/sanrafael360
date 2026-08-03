import { ConflictError, NotFoundError, ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';
import { createReservaRecursoRepository } from '../../reserva-recurso/repositories/reserva-recurso-repository';
import {
  DEFAULT_CANCELACION_POLITICA,
  DEFAULT_HORARIO_LUN_SAB_16_22,
} from '../../reserva-comercio/services/seed-jaditek';

export type AdminAltaComercioInput = {
  negocioDocumentId: string;
  slug?: string;
  nombre?: string;
  nombre_publico?: string;
  precio_ars?: number;
  duracion_minutos?: number;
  /** Nombres de recursos; si se omite, se usan `cantidad_recursos`. */
  recursos?: string[];
  /** Cantidad de puestos genéricos (default 4). Ignorado si `recursos` trae nombres. */
  cantidad_recursos?: number;
  operado_por_plataforma?: boolean;
};

export function normalizeSlug(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function resolveRecursoNames(input: AdminAltaComercioInput): string[] {
  if (Array.isArray(input.recursos) && input.recursos.length) {
    return input.recursos
      .map((n) => String(n || '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  const n = Number(input.cantidad_recursos ?? 4);
  if (!Number.isFinite(n) || n < 1 || n > 40) {
    throw new ValidationError('cantidad_recursos debe ser entre 1 y 40');
  }
  return Array.from({ length: Math.floor(n) }, (_, i) => `Puesto ${i + 1}`);
}

function serializeCreated(comercio: any) {
  return {
    documentId: comercio.documentId,
    nombre: comercio.nombre,
    nombre_publico: comercio.nombre_publico,
    slug: comercio.slug,
    activo: comercio.activo !== false,
    precio_ars: Number(comercio.precio_ars),
    duracion_minutos: comercio.duracion_minutos,
    modo_simulacion: Boolean(comercio.modo_simulacion),
    operado_por_plataforma: comercio.operado_por_plataforma !== false,
    recursos: (comercio.recursos || []).map((r: any) => ({
      documentId: r.documentId,
      nombre: r.nombre,
      orden: r.orden,
      activo: r.activo !== false,
    })),
    negocio: comercio.negocio
      ? {
          documentId: comercio.negocio.documentId,
          slug: comercio.negocio.slug,
          nombre: comercio.negocio.nombre,
        }
      : null,
  };
}

/**
 * Alta de módulo reservas (E1 / RES-DEC-009): solo Master Admin.
 * Siempre crea con modo_simulacion=true.
 */
export async function adminCreateComercio(strapi: any, input: AdminAltaComercioInput) {
  const negocioDocumentId = String(input.negocioDocumentId || '').trim();
  if (!negocioDocumentId) {
    throw new ValidationError('negocioDocumentId requerido');
  }

  const negocioRepo = createNegocioRepository(strapi);
  const comercioRepo = createReservaComercioRepository(strapi);
  const recursoRepo = createReservaRecursoRepository(strapi);

  const negocio = await negocioRepo.findById(negocioDocumentId, []);
  if (!negocio) {
    throw new NotFoundError('Negocio');
  }

  const already = await comercioRepo.findByNegocioDocumentId(negocioDocumentId);
  if (already) {
    throw new ConflictError(
      `El negocio ya tiene módulo de reservas (${already.slug}).`
    );
  }

  const slug = normalizeSlug(input.slug || negocio.slug || negocio.nombre);
  if (!slug) {
    throw new ValidationError('slug inválido');
  }

  const slugTaken = await comercioRepo.findBySlug(slug, {});
  if (slugTaken) {
    throw new ConflictError(`Ya existe un comercio de reservas con slug "${slug}".`);
  }

  const recursoNames = resolveRecursoNames(input);
  if (!recursoNames.length) {
    throw new ValidationError('Se necesita al menos 1 recurso');
  }

  const nombre = String(input.nombre || negocio.nombre || slug).trim();
  const nombrePublico = String(input.nombre_publico || nombre).trim();
  const precio = Number(input.precio_ars ?? 15000);
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ValidationError('precio_ars debe ser > 0');
  }
  const duracion = Number(input.duracion_minutos ?? 60);
  if (!Number.isFinite(duracion) || duracion < 15) {
    throw new ValidationError('duracion_minutos inválida');
  }

  const operado =
    input.operado_por_plataforma === undefined
      ? true
      : Boolean(input.operado_por_plataforma);

  const created = await comercioRepo.create({
    nombre,
    slug,
    nombre_publico: nombrePublico,
    activo: true,
    timezone: 'America/Argentina/Mendoza',
    duracion_minutos: duracion,
    buffer_limpieza_minutos: 0,
    anticipacion_llegada_minutos: 15,
    texto_llegada: 'Llegá con anticipación para dejar todo listo para tu turno.',
    precio_ars: precio,
    horario: DEFAULT_HORARIO_LUN_SAB_16_22,
    cancelacion_horas_minimas: 24,
    cancelacion_politica: DEFAULT_CANCELACION_POLITICA,
    hold_ttl_minutos: 15,
    modo_simulacion: true,
    operado_por_plataforma: operado,
    negocio: negocioDocumentId,
  });

  await recursoRepo.createMany(created.documentId, recursoNames);

  await negocioRepo.updateDraftAndPublished(negocioDocumentId, {
    reserva_url: `/reservas/${slug}`,
    reserva_habilitada: true,
  });

  const refreshed = await comercioRepo.findByDocumentId(created.documentId, {
    recursos: { sort: ['orden:asc'], fields: ['nombre', 'orden', 'activo'] },
    negocio: { fields: ['documentId', 'slug', 'nombre'] },
  });

  return serializeCreated(refreshed);
}
