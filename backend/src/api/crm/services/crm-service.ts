import { ForbiddenError, ValidationError } from '../../../utils/errors';
import { calendarDateInTimeZone, greetingNow } from '../../../utils/prospeccion-saludo';
import { buildWhatsappUrl, normalizeWhatsappDigits } from '../../../utils/whatsapp';
import { composeCrmMensaje } from '../crm-compose';
import {
  asDateOnly,
  cupoFromComercio,
  nextCupoCount,
  type CupoWhatsapp,
} from '../crm-cupo';
import { DEFAULT_CRM_FIRMA, DEFAULT_CRM_MENSAJE, DEFAULT_CRM_PROMPT_IA } from '../crm-defaults';
import { normalizeNombreKey, parseCrmIngestPayload, type CrmIngestItem } from '../crm-ingest';
import {
  assertContactoInTenant,
  createPrestamo,
  loadTenant,
  mapTenant,
  modoOf,
  type CrmActor,
  type CrmPrestamoInput,
} from '../crm-tenant';
import {
  assertFichaMinima,
  assertGuiaPuedePublicar,
  categoriaIdOf,
  negocioResumen,
  patchContactoTrasFicha,
} from '../crm-ficha';
import { foldAlcanzados } from '../crm-alcanzados';
import { estadoYNotaPatch, type CrmListQuery } from '../crm-estado';
import {
  assertPuedeEnviarWhatsapp,
  avisoWhatsappSinUrl,
  patchTrasWhatsapp,
} from '../crm-enviar';
import { adminCreateNegocio } from '../../negocio/services/admin-create-negocio';
import { createCrmRepository, type CrmRepository } from '../repositories/crm-repository';

export type { CrmEstado } from '../crm-estado';

export function mapCrmContacto(row: any) {
  if (!row) return null;
  const negocio = negocioResumen(row);
  return {
    documentId: row.documentId,
    nombre: row.nombre,
    telefono: row.telefono || '',
    instagram: row.instagram || '',
    nota: row.nota || '',
    origen: row.origen,
    estado: row.estado,
    no_contactar: Boolean(row.no_contactar),
    categoriaId: categoriaIdOf(row),
    categoriaNombre: row.categoria?.nombre || '',
    negocio,
    createdAt: row.createdAt,
  };
}

function readCupo(comercio: any): CupoWhatsapp {
  return cupoFromComercio(comercio, calendarDateInTimeZone());
}

async function bumpCupo(repo: CrmRepository, comercio: any): Promise<CupoWhatsapp> {
  const today = calendarDateInTimeZone();
  const current = cupoFromComercio(comercio, today);
  if (current.enviados >= current.limite) {
    throw new ValidationError(`Llegaste al cupo CRM de ${current.limite} WhatsApp de hoy`);
  }
  const next = nextCupoCount({
    storedFecha: asDateOnly(comercio.cupo_wsp_fecha),
    storedCount: Number(comercio.cupo_wsp_count || 0),
    today,
    contactosHoy: 0,
  });
  await repo.updateComercio(comercio.documentId, {
    cupo_wsp_fecha: today,
    cupo_wsp_count: next,
  });
  return { enviados: next, limite: current.limite, fecha: today };
}

async function insertContacto(
  repo: CrmRepository,
  comercioDocumentId: string,
  item: CrmIngestItem,
  origen: 'manual' | 'lista_ia'
) {
  const telefono_normalizado = normalizeWhatsappDigits(item.telefono);
  const dup = await repo.findDuplicate({
    comercioDocumentId,
    telefonoNormalizado: telefono_normalizado,
    nombreKey: normalizeNombreKey(item.nombre),
  });
  if (dup) {
    if (dup.en_cola === false) {
      await repo.updateContacto(dup.documentId, { en_cola: true });
      return {
        status: 'creado' as const,
        contacto: mapCrmContacto(await repo.findContacto(dup.documentId)),
      };
    }
    return { status: 'duplicado' as const, contacto: mapCrmContacto(dup) };
  }
  const created = await repo.createContacto({
    nombre: item.nombre,
    telefono: item.telefono,
    telefono_normalizado,
    instagram: item.instagram,
    nota: item.nota,
    origen,
    comercioDocumentId,
  });
  return { status: 'creado' as const, contacto: mapCrmContacto(created) };
}

export function createCrmService(strapi: any) {
  const repo = createCrmRepository(strapi);
  return {
    bootstrap: (actor: CrmActor, slug?: string) => bootstrap(repo, actor, slug),
    listContactos: (actor: CrmActor, query?: CrmListQuery, slug?: string) =>
      listContactos(repo, actor, query, slug),
    createManual: (actor: CrmActor, input: CrmIngestItem, slug?: string) =>
      createManual(repo, actor, input, slug),
    ingest: (actor: CrmActor, payload: string, slug?: string) =>
      ingest(repo, actor, payload, slug),
    updateContacto: (
      actor: CrmActor,
      documentId: string,
      patch: Record<string, unknown>,
      slug?: string
    ) => updateContacto(repo, actor, documentId, patch, slug),
    updatePlantilla: (
      actor: CrmActor,
      input: { mensaje: string; firma: string; prompt_ia?: string },
      slug?: string
    ) => updatePlantilla(repo, actor, input, slug),
    enviarWhatsapp: (actor: CrmActor, contactoDocumentId: string, slug?: string) =>
      enviarWhatsapp(repo, actor, contactoDocumentId, slug),
    crearFicha: (actor: CrmActor, contactoDocumentId: string, categoriaId?: string, slug?: string) =>
      crearFicha(strapi, repo, actor, contactoDocumentId, categoriaId, slug),
    listAlcanzados: (actor: CrmActor, slug?: string) => listAlcanzados(repo, actor, slug),
    limpiarCola: (actor: CrmActor, slug?: string) => limpiarCola(repo, actor, slug),
    prestar: (actor: CrmActor, input: CrmPrestamoInput) => prestar(repo, actor, input),
  };
}

async function listTenantsForAdmin(repo: CrmRepository, actor: CrmActor) {
  if (!actor.isAdmin) return undefined;
  const rows = (await repo.listComercios()) || [];
  return rows.map(mapTenant);
}

async function bootstrap(repo: CrmRepository, actor: CrmActor, slug?: string) {
  const { comercio, plantilla } = await loadTenant(repo, actor, slug);
  const contactos = await repo.listContactos(comercio.documentId, { soloCola: true });
  return {
    comercio: mapTenant(comercio),
    plantilla: {
      mensaje: plantilla.mensaje,
      firma: plantilla.firma || '',
      prompt_ia: plantilla.prompt_ia || DEFAULT_CRM_PROMPT_IA,
    },
    cupo: readCupo(comercio),
    contactos: (contactos || []).map(mapCrmContacto),
    canPrestar: actor.isAdmin,
    tenants: await listTenantsForAdmin(repo, actor),
  };
}

async function listContactos(
  repo: CrmRepository,
  actor: CrmActor,
  query: CrmListQuery | undefined,
  slug?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const rows = await repo.listContactos(comercio.documentId, query);
  return (rows || []).map(mapCrmContacto);
}

async function createManual(
  repo: CrmRepository,
  actor: CrmActor,
  input: CrmIngestItem,
  slug?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  if (!String(input.nombre || '').trim()) {
    throw new ValidationError('nombre es requerido');
  }
  return insertContacto(repo, comercio.documentId, input, 'manual');
}

async function ingest(repo: CrmRepository, actor: CrmActor, payload: string, slug?: string) {
  let items;
  try {
    items = parseCrmIngestPayload(payload);
  } catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : 'JSON inválido');
  }
  const { comercio } = await loadTenant(repo, actor, slug);
  const resultados = [];
  for (const item of items) {
    resultados.push(await insertContacto(repo, comercio.documentId, item, 'lista_ia'));
  }
  return {
    creados: resultados.filter((r) => r.status === 'creado').length,
    duplicados: resultados.filter((r) => r.status === 'duplicado').length,
    resultados,
  };
}

async function updatePlantilla(
  repo: CrmRepository,
  actor: CrmActor,
  input: { mensaje: string; firma: string; prompt_ia?: string },
  slug?: string
) {
  const { plantilla } = await loadTenant(repo, actor, slug);
  const data: Record<string, unknown> = {
    mensaje: String(input.mensaje || '').trim() || DEFAULT_CRM_MENSAJE,
    firma: String(input.firma || '').trim(),
  };
  if (input.prompt_ia != null) {
    data.prompt_ia = String(input.prompt_ia).trim() || DEFAULT_CRM_PROMPT_IA;
  }
  const updated = await repo.updatePlantilla(plantilla.documentId, data);
  return {
    mensaje: updated.mensaje,
    firma: updated.firma || '',
    prompt_ia: updated.prompt_ia,
  };
}

async function updateContacto(
  repo: CrmRepository,
  actor: CrmActor,
  documentId: string,
  patch: Record<string, unknown>,
  slug?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const row = await repo.findContacto(documentId);
  assertContactoInTenant(row, comercio.documentId);
  const data: Record<string, unknown> = estadoYNotaPatch(patch);
  if (patch.no_contactar != null) data.no_contactar = Boolean(patch.no_contactar);
  if (patch.telefono != null) {
    data.telefono = String(patch.telefono).trim();
    data.telefono_normalizado = normalizeWhatsappDigits(data.telefono as string);
  }
  if (patch.instagram != null) data.instagram = String(patch.instagram).trim();
  if (patch.categoriaId != null) {
    const categoriaId = String(patch.categoriaId).trim();
    data.categoria = categoriaId || null;
  }
  await repo.updateContacto(documentId, data);
  return mapCrmContacto(await repo.findContacto(documentId));
}

async function enviarWhatsapp(
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  slug?: string
) {
  const { comercio, plantilla } = await loadTenant(repo, actor, slug);
  const contacto = await repo.findContacto(contactoDocumentId);
  assertContactoInTenant(contacto, comercio.documentId);
  assertPuedeEnviarWhatsapp(contacto);
  const firma =
    plantilla.firma ||
    (modoOf(comercio) === 'agenda' ? comercio.nombre : DEFAULT_CRM_FIRMA);
  const texto = composeCrmMensaje({
    saludo: greetingNow(),
    nombre: contacto.nombre,
    mensaje: plantilla.mensaje,
    firma,
  });
  const whatsappUrl = buildWhatsappUrl(contacto.telefono, texto);
  const hasUrl = Boolean(whatsappUrl);
  await repo.updateContacto(contacto.documentId, patchTrasWhatsapp(contacto.estado, hasUrl));
  await repo.createActividad({
    tipo: 'envio_whatsapp',
    canal: 'whatsapp',
    texto: hasUrl ? texto : `WhatsApp no enviado: teléfono inválido. ${texto}`,
    contacto: contacto.documentId,
  });
  let cupo = readCupo(comercio);
  if (hasUrl) cupo = await bumpCupo(repo, comercio);
  const updated = mapCrmContacto(await repo.findContacto(contacto.documentId));
  return {
    whatsappUrl: whatsappUrl || null,
    texto,
    cupo,
    aviso: avisoWhatsappSinUrl(hasUrl),
    contacto: updated,
  };
}

async function crearFicha(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  categoriaId?: string,
  slug?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  assertGuiaPuedePublicar(actor, comercio);
  const contacto = await repo.findContacto(contactoDocumentId);
  assertContactoInTenant(contacto, comercio.documentId);
  const ya = negocioResumen(contacto);
  if (ya?.documentId) {
    return { created: false, contacto: mapCrmContacto(contacto), negocio: ya };
  }
  const categoria = String(categoriaId || categoriaIdOf(contacto) || '').trim();
  assertFichaMinima({
    nombre: contacto.nombre,
    telefono: contacto.telefono,
    categoriaId: categoria,
  });
  const negocio = await adminCreateNegocio(strapi, {
    nombre: contacto.nombre,
    categoriaId: categoria,
    telefono: contacto.telefono,
  });
  await repo.updateContacto(
    contacto.documentId,
    patchContactoTrasFicha(categoria, negocio.documentId)
  );
  await repo.createActividad({
    tipo: 'nota',
    canal: 'sistema',
    texto: `Ficha publicada: ${negocio.slug}`,
    contacto: contacto.documentId,
  });
  return {
    created: true,
    contacto: mapCrmContacto(await repo.findContacto(contacto.documentId)),
    negocio,
  };
}

async function listAlcanzados(repo: CrmRepository, actor: CrmActor, slug?: string) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const rows = await repo.listEnviosWhatsapp(comercio.documentId);
  return foldAlcanzados(rows);
}

async function limpiarCola(repo: CrmRepository, actor: CrmActor, slug?: string) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const ocultados = await repo.clearCola(comercio.documentId);
  return { ocultados };
}

async function prestar(repo: CrmRepository, actor: CrmActor, input: CrmPrestamoInput) {
  if (!actor.isAdmin) {
    throw new ForbiddenError('Solo el admin puede prestar el CRM');
  }
  return createPrestamo(repo, input);
}
