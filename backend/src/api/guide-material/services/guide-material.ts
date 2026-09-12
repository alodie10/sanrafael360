import { factories } from '@strapi/strapi';
import { NotFoundError } from '../../../utils/errors';
import { createGuideMaterialRepository } from '../repositories/guide-material-repository';
import { validateMaterialInput } from './material-validate';

function omitUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function toPublic(row: any) {
  if (!row) return null;
  return {
    documentId: row.documentId,
    titulo: row.titulo,
    cuerpo: row.cuerpo,
    activo: row.activo !== false,
    origen: row.origen || 'pegado',
    nombre_archivo: row.nombre_archivo || '',
    edited_by: row.edited_by || null,
    updatedAt: row.updatedAt,
  };
}

function toRuntime(row: any) {
  return { titulo: String(row.titulo || '').trim(), cuerpo: String(row.cuerpo || '').trim() };
}

export default factories.createCoreService('api::guide-material.guide-material' as any, ({ strapi }) => ({
  repo() {
    return createGuideMaterialRepository(strapi);
  },

  async listForAdmin() {
    const rows = await this.repo().findMany({});
    return rows.map(toPublic);
  },

  async listForRuntime() {
    try {
      const rows = await this.repo().findMany({ activo: { $eq: true } }, { limit: 40 });
      return rows.map(toRuntime).filter((row: { titulo: string; cuerpo: string }) => row.titulo && row.cuerpo);
    } catch {
      return [];
    }
  },

  async createMaterial(body: Record<string, unknown>, editedBy?: string) {
    const data = validateMaterialInput(body, false);
    const created = await this.repo().create({
      ...omitUndefined(data),
      origen: data.origen || 'pegado',
      activo: data.activo !== false,
      edited_by: editedBy || null,
    });
    return toPublic(created);
  },

  async updateMaterial(documentId: string, body: Record<string, unknown>, editedBy?: string) {
    const current = await this.repo().findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Material');
    const data = validateMaterialInput(body, true);
    const updated = await this.repo().update(documentId, {
      ...omitUndefined(data),
      edited_by: editedBy || current.edited_by,
    });
    return toPublic(updated);
  },

  async deleteMaterial(documentId: string) {
    const current = await this.repo().findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Material');
    await this.repo().delete(documentId);
    return { documentId };
  },
}));
