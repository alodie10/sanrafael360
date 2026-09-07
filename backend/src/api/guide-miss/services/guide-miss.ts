import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createGuideMissRepository } from '../repositories/guide-miss-repository';
import { stripNeedPhrases, normalizeGuideKey } from '../../guide-expansion/services/guide-text';

const ESTADOS = new Set(['pendiente', 'resuelto', 'ignorado']);

function toPublic(row: any) {
  if (!row) return null;
  return {
    documentId: row.documentId,
    raw_query: row.raw_query,
    query_norm: row.query_norm,
    expanded_queries: row.expanded_queries || [],
    categories_tried: row.categories_tried || [],
    count: row.count || 1,
    estado: row.estado,
    last_seen_at: row.last_seen_at,
    createdAt: row.createdAt,
    suggested_key: row.query_norm || stripNeedPhrases(row.raw_query || ''),
  };
}

export default factories.createCoreService('api::guide-miss.guide-miss' as any, ({ strapi }) => ({
  repo() {
    return createGuideMissRepository(strapi);
  },

  async recordMiss(input: {
    raw_query: string;
    expanded_queries?: string[];
    categories_tried?: string[];
  }) {
    const raw = (input.raw_query || '').trim();
    if (!raw) throw new ValidationError('raw_query es requerido');
    const query_norm = stripNeedPhrases(raw) || normalizeGuideKey(raw);
    const now = new Date().toISOString();
    const existing = await this.repo().findPendingByNorm(query_norm);
    if (existing) {
      return toPublic(
        await this.repo().update(existing.documentId, {
          raw_query: raw,
          expanded_queries: input.expanded_queries || [],
          categories_tried: input.categories_tried || [],
          count: (existing.count || 1) + 1,
          last_seen_at: now,
        })
      );
    }
    return toPublic(
      await this.repo().create({
        raw_query: raw,
        query_norm,
        expanded_queries: input.expanded_queries || [],
        categories_tried: input.categories_tried || [],
        count: 1,
        estado: 'pendiente',
        last_seen_at: now,
      })
    );
  },

  async listForAdmin(query: Record<string, unknown>) {
    const filters: Record<string, unknown> = {};
    const estado = typeof query.estado === 'string' ? query.estado : '';
    if (estado && estado !== 'todos' && ESTADOS.has(estado)) {
      filters.estado = { $eq: estado };
    }
    const search = typeof query.q === 'string' ? query.q.trim() : '';
    if (search) {
      filters.$or = [
        { raw_query: { $containsi: search } },
        { query_norm: { $containsi: search } },
      ];
    }
    const from = typeof query.from === 'string' ? query.from : '';
    const to = typeof query.to === 'string' ? query.to : '';
    if (from || to) {
      filters.last_seen_at = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
    const rows = await this.repo().findMany(filters, { limit: 200 });
    return rows.map(toPublic);
  },

  async patchEstado(documentId: string, estado: string) {
    if (!ESTADOS.has(estado)) throw new ValidationError('estado inválido');
    const current = await this.repo().findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Miss');
    return toPublic(await this.repo().update(documentId, { estado }));
  },
}));
