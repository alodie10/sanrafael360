import { NotFoundError, ValidationError } from '../../../utils/errors';
import { isPremiumListingActive, neverBeenPremium } from '../../../utils/premium-vigencia';
import { createNegocioRepository } from '../repositories/negocio-repository';

type UploadFile = { id?: number; documentId?: string };

const PUBLIC_MEDIA = ['logo', 'imagen_portada', 'galeria'] as const;
const DELETE_MEDIA = [...PUBLIC_MEDIA, 'documentacion_reclamo'] as const;

function asFiles(value: unknown): UploadFile[] {
  if (!value) return [];
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return asFiles((value as { data: unknown }).data);
  }
  const rows = Array.isArray(value) ? value : [value];
  return rows.filter((row): row is UploadFile =>
    Boolean(row && typeof row === 'object' && ('id' in row || 'documentId' in row))
  );
}

export function collectMediaFiles(
  negocio: Record<string, unknown>,
  fields: readonly string[] = PUBLIC_MEDIA
): UploadFile[] {
  const seen = new Set<number | string>();
  const files: UploadFile[] = [];
  for (const field of fields) {
    for (const file of asFiles(negocio[field])) {
      const key = file.id ?? file.documentId;
      if (key == null || seen.has(key)) continue;
      seen.add(key);
      files.push(file);
    }
  }
  return files;
}

async function destroyFiles(strapi: any, files: UploadFile[]): Promise<number> {
  let removed = 0;
  for (const file of files) {
    try {
      await strapi.plugin('upload').service('upload').remove(file);
      removed += 1;
    } catch (err: any) {
      strapi.log.warn(`[AdminCleanup] No se pudo borrar media ${file.id}: ${err.message}`);
    }
  }
  return removed;
}

export function createAdminNegocioCleanupService(strapi: any) {
  const repo = createNegocioRepository(strapi);

  async function purgeNeverPremiumMedia(documentId: string) {
      const negocio = await repo.findById(documentId, [...PUBLIC_MEDIA, 'categoria']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (!neverBeenPremium(negocio)) {
      throw new ValidationError('Solo se pueden borrar fotos de negocios que nunca fueron premium.');
    }
    const files = collectMediaFiles(negocio);
    const removed = await destroyFiles(strapi, files);
    await repo.updateDraftAndPublished(documentId, {
      logo: null,
      imagen_portada: null,
      galeria: [],
    });
    return { documentId, removed };
  }

  async function deleteNegocio(documentId: string) {
    const negocio = await repo.findById(documentId, [...DELETE_MEDIA]);
    if (!negocio) throw new NotFoundError('Negocio');
    if (isPremiumListingActive(negocio)) {
      throw new ValidationError('No se pueden borrar negocios premium vigentes.');
    }
    const removed = await destroyFiles(strapi, collectMediaFiles(negocio, DELETE_MEDIA));
    await repo.delete(documentId);
    return { documentId, removed };
  }

  async function purgeNeverPremiumMediaBatch() {
    const candidates = await repo.findNeverPremiumWithMedia(120);
    let purged = 0;
    let removed = 0;
    for (const negocio of candidates) {
      if (collectMediaFiles(negocio).length === 0) continue;
      if (!neverBeenPremium(negocio)) continue;
      const result = await purgeNeverPremiumMedia(negocio.documentId);
      purged += 1;
      removed += result.removed;
    }
    return { purged, removed, scanned: candidates.length };
  }

  return { purgeNeverPremiumMedia, deleteNegocio, purgeNeverPremiumMediaBatch };
}
