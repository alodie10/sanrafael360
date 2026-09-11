import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createEfemerideRepository } from '../repositories/efemeride-repository';
import {
  buildPublicItems,
  compareByNombreEs,
  countParticipantes,
  formatParticipanteLabel,
  isEfemerideTipo,
  isEfemerideVigente,
  isPremiumActivo,
  mapParticipantesExternos,
  normalizeTipo,
  sanitizeParticipantesExternos,
  slugifyNombre,
} from './efemeride-utils';

function mergeAdminRows(published: any[], drafts: any[]) {
  const byId = new Map<string, any>();
  for (const row of drafts) {
    byId.set(row.documentId, { ...row, publicationStatus: 'draft' });
  }
  for (const row of published) {
    byId.set(row.documentId, { ...row, publicationStatus: 'published' });
  }
  return [...byId.values()].sort((a, b) => compareByNombreEs(a.nombre, b.nombre));
}

function toAdminListItem(row: any) {
  const tipo = normalizeTipo(row.tipo);
  return {
    documentId: row.documentId,
    nombre: row.nombre,
    slug: row.slug,
    tipo,
    descripcion: row.descripcion || null,
    encabezado: row.encabezado || null,
    vigente_desde: row.vigente_desde || null,
    vigente_hasta: row.vigente_hasta || null,
    publicationStatus: row.publicationStatus,
    vigente: isEfemerideVigente(row),
    participantesCount: countParticipantes({ ...row, tipo }),
  };
}

function parseDate(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} debe ser una fecha válida`);
  }
  return parsed.toISOString();
}

function applyFichaFields(
  data: Record<string, unknown>,
  input: {
    vigente_desde?: unknown;
    vigente_hasta?: unknown;
    tipo?: unknown;
    negocioIds?: unknown;
    participantes_externos?: unknown;
  },
  current: { vigente_desde?: string | null; vigente_hasta?: string | null }
) {
  const desde = parseDate(input.vigente_desde, 'vigente_desde');
  const hasta = parseDate(input.vigente_hasta, 'vigente_hasta');
  if (desde !== undefined) data.vigente_desde = desde;
  if (hasta !== undefined) data.vigente_hasta = hasta;

  const nextDesde = (data.vigente_desde ?? current.vigente_desde) as string | null;
  const nextHasta = (data.vigente_hasta ?? current.vigente_hasta) as string | null;
  if (nextDesde && nextHasta && new Date(nextDesde) > new Date(nextHasta)) {
    throw new ValidationError('vigente_desde no puede ser posterior a vigente_hasta');
  }

  if (input.tipo !== undefined) {
    if (!isEfemerideTipo(input.tipo)) throw new ValidationError('tipo debe ser efemeride o feria');
    data.tipo = input.tipo;
  }

  if (input.negocioIds !== undefined) {
    if (!Array.isArray(input.negocioIds)) throw new ValidationError('negocioIds debe ser un array');
    const ids = [...new Set(input.negocioIds.map((id) => String(id)).filter(Boolean))];
    data.negocios = { set: ids.map((id) => ({ documentId: id })) };
  }

  if (input.participantes_externos !== undefined) {
    const parsed = sanitizeParticipantesExternos(input.participantes_externos);
    if (parsed.ok === false) throw new ValidationError(parsed.message);
    data.participantes_externos = parsed.items;
  }
}

type FichaInput = {
  nombre?: unknown;
  slug?: unknown;
  descripcion?: unknown;
  encabezadoId?: unknown;
  publicado?: unknown;
  vigente_desde?: unknown;
  vigente_hasta?: unknown;
  tipo?: unknown;
  negocioIds?: unknown;
  participantes_externos?: unknown;
};

function parseNombre(value: unknown): string {
  const nombre = String(value ?? '').trim().slice(0, 200);
  if (!nombre) throw new ValidationError('nombre es obligatorio');
  return nombre;
}

function parseEncabezadoId(value: unknown): number | null {
  if (value === null || value === '') return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('encabezadoId inválido');
  return id;
}

function applyIdentityFields(data: Record<string, unknown>, input: FichaInput) {
  if (input.nombre !== undefined) data.nombre = parseNombre(input.nombre);
  if (input.descripcion !== undefined) {
    data.descripcion = String(input.descripcion ?? '').trim().slice(0, 2000) || null;
  }
  if (input.encabezadoId !== undefined) data.encabezado = parseEncabezadoId(input.encabezadoId);
}

async function uniqueSlug(repo: any, raw: string, excludeDocumentId?: string) {
  const slug = slugifyNombre(raw);
  if (!slug) throw new ValidationError('slug inválido');
  let candidate = slug;
  for (let n = 2; n <= 50; n += 1) {
    if (!(await repo.slugTaken(candidate, excludeDocumentId))) return candidate;
    candidate = `${slug}-${n}`;
  }
  throw new ValidationError('No se pudo generar un slug único');
}

function pickUploadFile(files: any) {
  if (!files) return null;
  return files.encabezado || files.files || files.file || Object.values(files)[0] || null;
}

async function persistDraftAndPublished(repo: any, documentId: string, data: Record<string, unknown>) {
  await repo.update(documentId, data, 'draft');
  try {
    await repo.update(documentId, data, 'published');
  } catch {
    // Todavía no está publicada en Strapi.
  }
}

export default factories.createCoreService('api::efemeride.efemeride' as any, ({ strapi }) => ({
  async listForAdmin() {
    const repo = createEfemerideRepository(strapi);
    const [published, drafts] = await Promise.all([
      repo.findMany('published'),
      repo.findMany('draft'),
    ]);
    return mergeAdminRows(published, drafts).map(toAdminListItem);
  },

  async getForAdmin(documentId: string) {
    const repo = createEfemerideRepository(strapi);
    const published = await repo.findByDocumentId(documentId, 'published');
    const draft = published ? null : await repo.findByDocumentId(documentId, 'draft');
    const row = published || draft;
    if (!row) throw new NotFoundError('Efeméride');

    return {
      ...toAdminListItem({
        ...row,
        publicationStatus: published ? 'published' : 'draft',
      }),
      negocios: (row.negocios || []).map((n: any) => n.documentId),
      participantes_externos: mapParticipantesExternos(row.participantes_externos),
    };
  },

  async listPremiumPicker() {
    const repo = createEfemerideRepository(strapi);
    const rows = await repo.findPremiumNegocios();
    return rows
      .filter((n: any) => isPremiumActivo(n))
      .sort((a: any, b: any) => compareByNombreEs(a.nombre, b.nombre))
      .map((n: any) => ({
        documentId: n.documentId,
        nombre: n.nombre,
        slug: n.slug,
        categoria: n.categoria?.nombre || null,
        label: formatParticipanteLabel(n.nombre, n.categoria?.nombre),
      }));
  },

  async updateFicha(documentId: string, input: FichaInput) {
    const repo = createEfemerideRepository(strapi);
    const current =
      (await repo.findByDocumentId(documentId, 'published')) ||
      (await repo.findByDocumentId(documentId, 'draft'));
    if (!current) throw new NotFoundError('Efeméride');

    const data: Record<string, unknown> = {};
    applyFichaFields(data, input, current);
    applyIdentityFields(data, input);
    if (input.slug !== undefined) {
      data.slug = await uniqueSlug(repo, String(input.slug), documentId);
    }

    if (Object.keys(data).length > 0) {
      await persistDraftAndPublished(repo, documentId, data);
    }

    try {
      if (input.publicado === true) await repo.publish(documentId);
      if (input.publicado === false) await repo.unpublish(documentId);
    } catch {
      // El documento puede no tener aún versión publicada o ya estar en ese estado.
    }

    return this.getForAdmin(documentId);
  },

  async createFicha(input: FichaInput) {
    const repo = createEfemerideRepository(strapi);
    const nombre = parseNombre(input.nombre);
    const tipo = input.tipo === undefined ? 'efemeride' : input.tipo;
    if (!isEfemerideTipo(tipo)) throw new ValidationError('tipo debe ser efemeride o feria');

    const data: Record<string, unknown> = { nombre, tipo };
    applyFichaFields(data, input, {});
    applyIdentityFields(data, input);
    data.nombre = nombre;
    data.slug = await uniqueSlug(repo, String(input.slug || nombre));

    const published = input.publicado !== false;
    const created = await repo.create(data, published ? 'published' : 'draft');
    return this.getForAdmin(created.documentId);
  },

  async deleteFicha(documentId: string) {
    const repo = createEfemerideRepository(strapi);
    const current =
      (await repo.findByDocumentId(documentId, 'published')) ||
      (await repo.findByDocumentId(documentId, 'draft'));
    if (!current) throw new NotFoundError('Efeméride');
    await repo.delete(documentId);
    return { ok: true, documentId };
  },

  async uploadEncabezado(files: any) {
    const file = pickUploadFile(files);
    if (!file) throw new ValidationError('Subí una imagen de encabezado');
    const mime = String(file.type || file.mimetype || '').toLowerCase();
    if (mime && !mime.startsWith('image/')) {
      throw new ValidationError('El encabezado debe ser una imagen');
    }
    const repo = createEfemerideRepository(strapi);
    const uploaded = await repo.uploadFiles(file);
    const item = uploaded?.[0];
    if (!item) throw new ValidationError('No se pudo subir la imagen');
    return {
      id: item.id,
      url: item.url,
      alternativeText: item.alternativeText || null,
      width: item.width || null,
      height: item.height || null,
    };
  },

  async listPublic() {
    const repo = createEfemerideRepository(strapi);
    const rows = await repo.findPublishedList();
    return rows.filter((row: any) => isEfemerideVigente(row)).map((row: any) => ({
      documentId: row.documentId,
      nombre: row.nombre,
      slug: row.slug,
      tipo: normalizeTipo(row.tipo),
      descripcion: row.descripcion || null,
      encabezado: row.encabezado || null,
      vigente_hasta: row.vigente_hasta || null,
    }));
  },

  async getPublicBySlug(slug: string) {
    const repo = createEfemerideRepository(strapi);
    const row = await repo.findPublishedBySlug(slug);
    if (!row || !isEfemerideVigente(row)) throw new NotFoundError('Efeméride');
    const tipo = normalizeTipo(row.tipo);

    return {
      documentId: row.documentId,
      nombre: row.nombre,
      slug: row.slug,
      tipo,
      descripcion: row.descripcion || null,
      encabezado: row.encabezado || null,
      vigente_desde: row.vigente_desde || null,
      vigente_hasta: row.vigente_hasta || null,
      items: tipo === 'feria' ? [] : buildPublicItems(row.negocios || []),
      participantes_externos:
        tipo === 'feria' ? mapParticipantesExternos(row.participantes_externos) : [],
    };
  },
}));
