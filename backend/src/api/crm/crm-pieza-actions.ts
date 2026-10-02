import { NotFoundError, ValidationError } from '../../utils/errors';
import { normalizePlantillaSlots } from '../../utils/plantilla-slots';
import { loadTenant, type CrmActor } from './crm-tenant';
import type { CrmRepository } from './repositories/crm-repository';
import {
  assertPiezaImage,
  isPiezaToken,
  mapCrmPieza,
  mapCrmPiezaCard,
  newPiezaToken,
  type CrmPiezaCard,
  type CrmPiezaPublica,
} from './crm-pieza';

export async function listPiezasDePlantilla(
  repo: CrmRepository,
  plantillaDocumentId: string
): Promise<CrmPiezaCard[]> {
  const rows = (await repo.listPiezas(plantillaDocumentId)) || [];
  return rows.map(mapCrmPiezaCard).filter((row): row is CrmPiezaCard => Boolean(row));
}

export async function syncPiezaTitulos(repo: CrmRepository, plantilla: any) {
  const slots = normalizePlantillaSlots(plantilla?.mensajes, plantilla?.mensaje);
  const rows = (await repo.listPiezas(plantilla.documentId)) || [];
  for (const row of rows) {
    const titulo = slots[Number(row.slot_index)]?.titulo;
    if (titulo && titulo !== row.titulo) {
      await repo.updatePieza(row.documentId, { titulo });
    }
  }
}

export async function subirPieza(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  input: { slotIndex: number; file: any; slug?: string }
) {
  assertPiezaImage(input.file);
  const { plantilla } = await loadTenant(repo, actor, input.slug);
  const slots = normalizePlantillaSlots(plantilla.mensajes, plantilla.mensaje);
  const titulo = slots[input.slotIndex]?.titulo || 'Mensaje';
  const uploaded = await repo.uploadImage(input.file);
  const file = uploaded?.[0];
  if (!file?.id) throw new ValidationError('No se pudo guardar la imagen');
  const existing = await repo.findPiezaBySlot(plantilla.documentId, input.slotIndex);
  const saved = existing
    ? await replacePieza(strapi, repo, existing, file, titulo)
    : await repo.createPieza({
        token: newPiezaToken(),
        titulo,
        slot_index: input.slotIndex,
        imagen: file.id,
        plantilla: plantilla.documentId,
      });
  return requirePieza(await repo.findPieza(saved.documentId));
}

export async function quitarPieza(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  slotIndex: number,
  slug?: string
) {
  const { plantilla } = await loadTenant(repo, actor, slug);
  const existing = await repo.findPiezaBySlot(plantilla.documentId, slotIndex);
  if (!existing) return { removed: false, slotIndex };
  const imagen = existing.imagen;
  await repo.deletePieza(existing.documentId);
  await dropUpload(strapi, repo, imagen);
  return { removed: true, slotIndex };
}

export async function verPiezaPublica(repo: CrmRepository, token: string): Promise<CrmPiezaPublica> {
  if (!isPiezaToken(token)) throw new NotFoundError('Pieza');
  const row = await repo.findPiezaByToken(token);
  const mapped = mapCrmPieza(row);
  if (!mapped) throw new NotFoundError('Pieza');
  return mapped;
}

async function replacePieza(strapi: any, repo: CrmRepository, existing: any, file: any, titulo: string) {
  const previous = existing.imagen;
  const updated = await repo.updatePieza(existing.documentId, { imagen: file.id, titulo });
  if (previous?.id && previous.id !== file.id) await dropUpload(strapi, repo, previous);
  return updated;
}

async function dropUpload(strapi: any, repo: CrmRepository, file: any) {
  if (!file?.id) return;
  try {
    await repo.removeUpload(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    strapi.log.warn(`[crm-pieza] no se pudo borrar la imagen anterior: ${message}`);
  }
}

function requirePieza(row: any): CrmPiezaPublica {
  const mapped = mapCrmPieza(row);
  if (!mapped) throw new ValidationError('No se pudo publicar la imagen');
  return mapped;
}
