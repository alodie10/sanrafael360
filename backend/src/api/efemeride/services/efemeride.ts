import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createEfemerideRepository } from '../repositories/efemeride-repository';
import {
  buildPublicItems,
  compareByNombreEs,
  formatParticipanteLabel,
  isEfemerideVigente,
  isPremiumActivo,
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
  const vigente = isEfemerideVigente(row);
  return {
    documentId: row.documentId,
    nombre: row.nombre,
    slug: row.slug,
    descripcion: row.descripcion || null,
    encabezado: row.encabezado || null,
    vigente_desde: row.vigente_desde || null,
    vigente_hasta: row.vigente_hasta || null,
    publicationStatus: row.publicationStatus,
    vigente,
    participantesCount: Array.isArray(row.negocios) ? row.negocios.length : 0,
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

  async updateFicha(
    documentId: string,
    input: { vigente_desde?: unknown; vigente_hasta?: unknown; negocioIds?: unknown }
  ) {
    const repo = createEfemerideRepository(strapi);
    const current =
      (await repo.findByDocumentId(documentId, 'published')) ||
      (await repo.findByDocumentId(documentId, 'draft'));
    if (!current) throw new NotFoundError('Efeméride');

    const data: Record<string, unknown> = {};
    const desde = parseDate(input.vigente_desde, 'vigente_desde');
    const hasta = parseDate(input.vigente_hasta, 'vigente_hasta');
    if (desde !== undefined) data.vigente_desde = desde;
    if (hasta !== undefined) data.vigente_hasta = hasta;

    const nextDesde = (data.vigente_desde ?? current.vigente_desde) as string | null;
    const nextHasta = (data.vigente_hasta ?? current.vigente_hasta) as string | null;
    if (nextDesde && nextHasta && new Date(nextDesde) > new Date(nextHasta)) {
      throw new ValidationError('vigente_desde no puede ser posterior a vigente_hasta');
    }

    if (input.negocioIds !== undefined) {
      if (!Array.isArray(input.negocioIds)) {
        throw new ValidationError('negocioIds debe ser un array');
      }
      const ids = [...new Set(input.negocioIds.map((id) => String(id)).filter(Boolean))];
      data.negocios = { set: ids.map((id) => ({ documentId: id })) };
    }

    await repo.update(documentId, data, 'draft');
    try {
      await repo.update(documentId, data, 'published');
    } catch {
      // Todavía no está publicada en Strapi.
    }

    return this.getForAdmin(documentId);
  },

  async listPublic() {
    const repo = createEfemerideRepository(strapi);
    const rows = await repo.findPublishedList();
    return rows.filter((row: any) => isEfemerideVigente(row)).map((row: any) => ({
      documentId: row.documentId,
      nombre: row.nombre,
      slug: row.slug,
      descripcion: row.descripcion || null,
      encabezado: row.encabezado || null,
      vigente_hasta: row.vigente_hasta || null,
    }));
  },

  async getPublicBySlug(slug: string) {
    const repo = createEfemerideRepository(strapi);
    const row = await repo.findPublishedBySlug(slug);
    if (!row || !isEfemerideVigente(row)) throw new NotFoundError('Efeméride');

    return {
      documentId: row.documentId,
      nombre: row.nombre,
      slug: row.slug,
      descripcion: row.descripcion || null,
      encabezado: row.encabezado || null,
      vigente_desde: row.vigente_desde || null,
      vigente_hasta: row.vigente_hasta || null,
      items: buildPublicItems(row.negocios || []),
    };
  },
}));
