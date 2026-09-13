import { NotFoundError, ValidationError } from '../../../utils/errors';
import { greetingNow } from '../../../utils/prospeccion-saludo';
import { buildWhatsappUrl } from '../../../utils/whatsapp';
import { buildInstagramDmUrl, resolveInstagramUsername } from '../../../utils/instagram';
import { createUserRepository, type UserRepository } from '../../../repositories/user-repository';
import {
  DEFAULT_PROSPECCION_PLANTILLA,
  composeFichaMensaje,
  guideHomeUrl,
  migratePlantillaCopy,
  resolveFirma,
  type ProspeccionPlantillaFields,
} from '../plantilla-defaults';
import {
  createProspeccionRepository,
  plantillaFromDoc,
  type AlcanzadosQuery,
  type ProspeccionRepository,
} from '../repositories/prospeccion-repository';

export type EnviarTipo = 'saludo' | 'ficha_mensaje';
export type EnviarCanal = 'whatsapp' | 'instagram';

export function mapNegocioForPanel(negocio: any) {
  if (!negocio) return null;
  return {
    documentId: negocio.documentId,
    nombre: negocio.nombre,
    slug: negocio.slug,
    whatsapp: negocio.whatsapp || null,
    telefono: negocio.telefono || null,
    instagram: negocio.instagram || null,
    instagram_username: resolveInstagramUsername({
      instagram_username: negocio.instagram_username,
      instagram: negocio.instagram,
    }),
    categoriaNombre: negocio.categoria?.nombre || null,
  };
}

async function ensurePlantilla(repo: ProspeccionRepository) {
  const existing = await repo.findPlantilla();
  if (!existing) {
    const created = await repo.createPlantilla(DEFAULT_PROSPECCION_PLANTILLA);
    return plantillaFromDoc(created);
  }
  const current = plantillaFromDoc(existing);
  const migrated = migratePlantillaCopy(current);
  if (
    migrated.texto_ficha !== current.texto_ficha ||
    migrated.mensaje !== current.mensaje
  ) {
    await repo.updatePlantilla(existing.documentId, {
      texto_ficha: migrated.texto_ficha,
      mensaje: migrated.mensaje,
    });
    return migrated;
  }
  return current;
}

async function plantillaForUser(
  repo: ProspeccionRepository,
  userRepo: UserRepository,
  userId: number
): Promise<ProspeccionPlantillaFields> {
  const global = await ensurePlantilla(repo);
  const userFirma = await userRepo.getFirmaProspeccion(userId);
  return { ...global, firma: resolveFirma(userFirma, global.firma) };
}

async function updatePlantilla(
  repo: ProspeccionRepository,
  userRepo: UserRepository,
  userId: number,
  input: ProspeccionPlantillaFields
) {
  const existing = await repo.findPlantilla();
  if (!existing) {
    await repo.createPlantilla({
      ...DEFAULT_PROSPECCION_PLANTILLA,
      texto_ficha: input.texto_ficha,
      mensaje: input.mensaje,
    });
  } else {
    await repo.updatePlantilla(existing.documentId, {
      texto_ficha: input.texto_ficha,
      mensaje: input.mensaje,
    });
  }
  await userRepo.setFirmaProspeccion(userId, input.firma);
  return plantillaForUser(repo, userRepo, userId);
}

function composeEnvioTexto(tipo: EnviarTipo, plantilla: ProspeccionPlantillaFields) {
  if (tipo === 'saludo') return greetingNow();
  return composeFichaMensaje({
    url: guideHomeUrl(),
    ...plantilla,
  });
}

async function upsertContacto(
  repo: ProspeccionRepository,
  negocioDocumentId: string,
  tipo: EnviarTipo
) {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    ultimo_tipo: tipo,
    ultimo_envio_at: now,
    ficha_enviada_at: now,
  };

  const existing = await repo.findContactoByNegocio(negocioDocumentId);
  if (existing) {
    await repo.updateContacto(existing.documentId, patch);
    return;
  }
  await repo.createContacto({ ...patch, negocio: negocioDocumentId });
}

function destinosForCanal(negocio: any, canal: EnviarCanal, texto: string) {
  if (canal === 'instagram') {
    const instagramUrl = buildInstagramDmUrl(
      resolveInstagramUsername({
        instagram_username: negocio.instagram_username,
        instagram: negocio.instagram,
      })
    );
    if (!instagramUrl) {
      throw new ValidationError('El negocio no tiene un usuario de Instagram válido');
    }
    return { whatsappUrl: null as string | null, instagramUrl };
  }

  const phone = negocio.whatsapp || negocio.telefono;
  const whatsappUrl = buildWhatsappUrl(phone, texto);
  if (!whatsappUrl) {
    throw new ValidationError('El negocio no tiene un teléfono de WhatsApp válido');
  }
  return { whatsappUrl, instagramUrl: null as string | null };
}

async function enviarMensaje(
  repo: ProspeccionRepository,
  userRepo: UserRepository,
  userId: number,
  negocioDocumentId: string,
  tipo: EnviarTipo,
  canal: EnviarCanal
) {
  const negocio = await repo.findNegocioByDocumentId(negocioDocumentId);
  if (!negocio) throw new NotFoundError('Negocio');

  const plantilla = await plantillaForUser(repo, userRepo, userId);
  const texto = composeEnvioTexto(tipo, plantilla);
  const destinos = destinosForCanal(negocio, canal, texto);

  if (tipo === 'ficha_mensaje') {
    await upsertContacto(repo, negocioDocumentId, tipo);
  }
  return { ...destinos, texto, negocio: mapNegocioForPanel(negocio) };
}

export function createProspeccionService(strapi: any) {
  const repo = createProspeccionRepository(strapi);
  const userRepo = createUserRepository(strapi);
  return {
    getPlantilla: (userId: number) => plantillaForUser(repo, userRepo, userId),
    ensurePlantilla: () => ensurePlantilla(repo),
    updatePlantilla: (userId: number, input: ProspeccionPlantillaFields) =>
      updatePlantilla(repo, userRepo, userId, input),
    listAlcanzados: async (query: AlcanzadosQuery) => {
      const rows = await repo.findAlcanzados(query);
      return (rows || []).map((row: any) => ({
        documentId: row.documentId,
        ultimo_tipo: row.ultimo_tipo,
        ultimo_envio_at: row.ultimo_envio_at,
        negocio: mapNegocioForPanel(row.negocio),
      }));
    },
    searchNegocios: async (search: string) => {
      if (!search.trim() || search.trim().length < 2) return [];
      const rows = await repo.searchNegocios(search);
      return (rows || []).map(mapNegocioForPanel);
    },
    getNegocio: async (documentId: string) => {
      const negocio = await repo.findNegocioByDocumentId(documentId);
      if (!negocio) throw new NotFoundError('Negocio');
      return mapNegocioForPanel(negocio);
    },
    enviar: (
      userId: number,
      negocioDocumentId: string,
      tipo: EnviarTipo,
      canal: EnviarCanal = 'whatsapp'
    ) => enviarMensaje(repo, userRepo, userId, negocioDocumentId, tipo, canal),
  };
}
