import { NotFoundError, ValidationError } from '../../../utils/errors';
import { greetingNow } from '../../../utils/prospeccion-saludo';
import { buildWhatsappUrl } from '../../../utils/whatsapp';
import {
  DEFAULT_PROSPECCION_PLANTILLA,
  composeFichaMensaje,
  fichaUrlForSlug,
  type ProspeccionPlantillaFields,
} from '../plantilla-defaults';
import {
  createProspeccionRepository,
  plantillaFromDoc,
  type AlcanzadosQuery,
  type ProspeccionRepository,
} from '../repositories/prospeccion-repository';

export type EnviarTipo = 'saludo' | 'ficha_mensaje';

export function mapNegocioForPanel(negocio: any) {
  if (!negocio) return null;
  return {
    documentId: negocio.documentId,
    nombre: negocio.nombre,
    slug: negocio.slug,
    whatsapp: negocio.whatsapp || null,
    telefono: negocio.telefono || null,
    categoriaNombre: negocio.categoria?.nombre || null,
  };
}

async function ensurePlantilla(repo: ProspeccionRepository) {
  const existing = await repo.findPlantilla();
  if (existing) return plantillaFromDoc(existing);
  const created = await repo.createPlantilla(DEFAULT_PROSPECCION_PLANTILLA);
  return plantillaFromDoc(created);
}

async function updatePlantilla(
  repo: ProspeccionRepository,
  input: ProspeccionPlantillaFields
) {
  const existing = await repo.findPlantilla();
  if (!existing) {
    await repo.createPlantilla(input);
    return input;
  }
  const updated = await repo.updatePlantilla(existing.documentId, input);
  return plantillaFromDoc(updated);
}

function composeEnvioTexto(negocio: any, tipo: EnviarTipo, plantilla: ProspeccionPlantillaFields) {
  if (tipo === 'saludo') return greetingNow();
  return composeFichaMensaje({
    url: fichaUrlForSlug(negocio.slug),
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
  };
  if (tipo === 'saludo') patch.saludo_enviado_at = now;
  if (tipo === 'ficha_mensaje') patch.ficha_enviada_at = now;

  const existing = await repo.findContactoByNegocio(negocioDocumentId);
  if (existing) {
    await repo.updateContacto(existing.documentId, patch);
    return;
  }
  await repo.createContacto({ ...patch, negocio: negocioDocumentId });
}

async function enviarWhatsapp(
  repo: ProspeccionRepository,
  negocioDocumentId: string,
  tipo: EnviarTipo
) {
  const negocio = await repo.findNegocioByDocumentId(negocioDocumentId);
  if (!negocio) throw new NotFoundError('Negocio');

  const phone = negocio.whatsapp || negocio.telefono;
  const plantilla = await ensurePlantilla(repo);
  const texto = composeEnvioTexto(negocio, tipo, plantilla);
  const whatsappUrl = buildWhatsappUrl(phone, texto);
  if (!whatsappUrl) {
    throw new ValidationError('El negocio no tiene un teléfono de WhatsApp válido');
  }

  await upsertContacto(repo, negocioDocumentId, tipo);
  return { whatsappUrl, texto, negocio: mapNegocioForPanel(negocio) };
}

export function createProspeccionService(strapi: any) {
  const repo = createProspeccionRepository(strapi);
  return {
    ensurePlantilla: () => ensurePlantilla(repo),
    updatePlantilla: (input: ProspeccionPlantillaFields) => updatePlantilla(repo, input),
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
    enviar: (negocioDocumentId: string, tipo: EnviarTipo) =>
      enviarWhatsapp(repo, negocioDocumentId, tipo),
  };
}
