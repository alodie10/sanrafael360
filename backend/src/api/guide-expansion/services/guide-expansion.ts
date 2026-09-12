import { factories } from '@strapi/strapi';
import { ConflictError, NotFoundError, ValidationError } from '../../../utils/errors';
import { createGuideExpansionRepository } from '../repositories/guide-expansion-repository';
import { validateExpansionInput } from './expansion-validate';
import { asStringList, canonicalizeCategoryNames } from './guide-text';

function toPublic(row: any) {
  if (!row) return null;
  return {
    documentId: row.documentId,
    key: row.key,
    aliases: asStringList(row.aliases),
    queries: asStringList(row.queries),
    categories: asStringList(row.categories),
    match_mode: row.match_mode || 'default',
    exclude_name_needles: asStringList(row.exclude_name_needles),
    prefer_name_needles: asStringList(row.prefer_name_needles),
    activo: row.activo !== false,
    notas: row.notas || '',
    edited_by: row.edited_by || null,
    updatedAt: row.updatedAt,
  };
}

function omitUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function toIntentEntry(row: any) {
  return {
    aliases: asStringList(row.aliases),
    queries: asStringList(row.queries),
    categories: asStringList(row.categories),
    match: row.match_mode || 'default',
    excludeNameNeedles: asStringList(row.exclude_name_needles),
    preferNameNeedles: asStringList(row.prefer_name_needles),
  };
}

export default factories.createCoreService('api::guide-expansion.guide-expansion' as any, ({ strapi }) => ({
  repo() {
    return createGuideExpansionRepository(strapi);
  },

  async catalogCategoryNames() {
    try {
      const rows = await strapi.documents('api::categoria.categoria' as any).findMany({
        fields: ['nombre'],
        limit: 200,
      });
      return (rows || []).map((row: { nombre?: string }) => row.nombre).filter(Boolean) as string[];
    } catch {
      return [];
    }
  },

  async withCanonicalCategories(data: Record<string, unknown>) {
    if (!Array.isArray(data.categories) || !data.categories.length) return data;
    const catalog = await this.catalogCategoryNames();
    if (!catalog.length) return data;
    return { ...data, categories: canonicalizeCategoryNames(data.categories as string[], catalog) };
  },

  async listForAdmin() {
    const rows = await this.repo().findMany({});
    return rows.map(toPublic);
  },

  async createExpansion(body: Record<string, unknown>, editedBy?: string) {
    const data = await this.withCanonicalCategories(validateExpansionInput(body, false));
    const exists = await this.repo().findByKey(data.key as string);
    if (exists) throw new ConflictError('Ya existe una expansión con esa key');
    const created = await this.repo().create({ ...omitUndefined(data), edited_by: editedBy || null });
    return toPublic(created);
  },

  async updateExpansion(documentId: string, body: Record<string, unknown>, editedBy?: string) {
    const current = await this.repo().findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Expansión');
    const data = await this.withCanonicalCategories(validateExpansionInput(body, true));
    if (data.key && data.key !== current.key) {
      const exists = await this.repo().findByKey(data.key);
      if (exists) throw new ConflictError('Ya existe una expansión con esa key');
    }
    const nextQueries = data.queries ?? current.queries ?? [];
    const nextCategories = data.categories ?? current.categories ?? [];
    if (!nextQueries.length && !nextCategories.length) {
      throw new ValidationError('queries o categories: al menos uno no vacío');
    }
    const updated = await this.repo().update(documentId, {
      ...omitUndefined(data),
      edited_by: editedBy || current.edited_by,
    });
    return toPublic(updated);
  },

  async duplicateExpansion(documentId: string, editedBy?: string) {
    const current = await this.repo().findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Expansión');
    let key = `${current.key}-copia`;
    let n = 2;
    while (await this.repo().findByKey(key)) {
      key = `${current.key}-copia-${n}`;
      n += 1;
    }
    const created = await this.repo().create({
      key,
      aliases: current.aliases || [],
      queries: current.queries || [],
      categories: current.categories || [],
      match_mode: current.match_mode || 'default',
      exclude_name_needles: current.exclude_name_needles || [],
      prefer_name_needles: current.prefer_name_needles || [],
      activo: false,
      notas: current.notas || '',
      edited_by: editedBy || null,
    });
    return toPublic(created);
  },

  async activeIntentMap() {
    const rows = await this.repo().findMany({ activo: { $eq: true } });
    const catalog = await this.catalogCategoryNames();
    const map: Record<string, ReturnType<typeof toIntentEntry>> = {};
    for (const row of rows) {
      const entry = toIntentEntry(row);
      entry.categories = canonicalizeCategoryNames(entry.categories, catalog);
      map[row.key] = entry;
    }
    return map;
  },

  async getPublicRuntime() {
    const [expansions, settings, categories] = await Promise.all([
      this.activeIntentMap(),
      strapi.service('api::guide-setting.guide-setting').getSettings(),
      this.catalogCategoryNames(),
    ]);
    return { expansions, settings, categories };
  },
}));
