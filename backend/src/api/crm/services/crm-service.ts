import { ForbiddenError, ValidationError } from '../../../utils/errors';
import { calendarDateInTimeZone, greetingNow } from '../../../utils/prospeccion-saludo';
import { buildWhatsappUrl, normalizeWhatsappDigits } from '../../../utils/whatsapp';
import { composeCrmMensaje } from '../crm-compose';
import { abrirBorradorMail } from '../crm-mail-draft';
import { renderCrmMailHtml } from '../crm-mail-html';
import {
  asDateOnly,
  CUPO_DEVUELTO_TEXTO,
  CUPO_MAIL_DEVUELTO_TEXTO,
  cupoFromComercio,
  cupoLleno,
  cupoMailFromComercio,
  cupoTrasErrorWsp,
  nextCupoCount,
  resumenCupoActividades,
  resumenCupoMailActividades,
  type CupoWhatsapp,
} from '../crm-cupo';
import { DEFAULT_CRM_FIRMA } from '../crm-defaults';
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
  mailDeFicha,
  categoriaIdOf,
  fichaPorTelefono,
  negocioResumen,
  patchContactoTrasFicha,
} from '../crm-ficha';
import { foldAlcanzados } from '../crm-alcanzados';
import { mapNotaActividades } from '../crm-prospector';
import { estadoYNotaPatch, type CrmListQuery } from '../crm-estado';
import {
  asuntoDeCampana,
  assertPuedeEnviarMail,
  assertPuedeEnviarWhatsapp,
  avisoMailSinUrl,
  avisoWhatsappSinUrl,
  CRM_MAIL_NO_ENVIADO,
  normalizeCrmEmail,
  CRM_WSP_NO_ENVIADO,
  patchTrasWhatsapp,
} from '../crm-enviar';
import { mapCrmPlantilla, plantillaSavePayload, slotDePlantilla, type CrmPlantillaInput } from '../crm-plantilla-map';
import { mapCrmPieza } from '../crm-pieza';
import {
  listPiezasDePlantilla,
  quitarPieza,
  subirPieza,
  syncPiezaTitulos,
  verPiezaPublica,
} from '../crm-pieza-actions';
import { adminCreateNegocio } from '../../negocio/services/admin-create-negocio';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { createCrmRepository, type CrmRepository } from '../repositories/crm-repository';

export type { CrmEstado } from '../crm-estado';

export function mapCrmContacto(row: any) {
  if (!row) return null;
  const negocio = negocioResumen(row);
  return {
    documentId: row.documentId,
    nombre: row.nombre,
    telefono: row.telefono || '',
    email: row.email || '',
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

function readCupoMail(comercio: any): CupoWhatsapp {
  return cupoMailFromComercio(comercio, calendarDateInTimeZone());
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

async function bumpCupoMail(repo: CrmRepository, comercio: any): Promise<CupoWhatsapp> {
  const today = calendarDateInTimeZone();
  const current = cupoMailFromComercio(comercio, today);
  if (current.enviados >= current.limite) {
    throw new ValidationError(`Llegaste al cupo CRM de ${current.limite} mails de hoy`);
  }
  const next = nextCupoCount({
    storedFecha: asDateOnly(comercio.cupo_mail_fecha),
    storedCount: Number(comercio.cupo_mail_count || 0),
    today,
    contactosHoy: 0,
  });
  await repo.updateComercio(comercio.documentId, {
    cupo_mail_fecha: today,
    cupo_mail_count: next,
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
  const email_normalizado = normalizeCrmEmail(item.email);
  const dup = await repo.findDuplicate({
    comercioDocumentId,
    telefonoNormalizado: telefono_normalizado,
    emailNormalizado: email_normalizado,
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
    email: item.email,
    email_normalizado,
    instagram: item.instagram,
    nota: item.nota,
    origen,
    comercioDocumentId,
  });
  const texto = String(item.nota || '').trim();
  if (texto) {
    await repo.createActividad({
      tipo: 'nota',
      canal: 'sistema',
      texto,
      contacto: created.documentId,
    });
  }
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
      ingest(strapi, repo, actor, payload, slug),
    updateContacto: (
      actor: CrmActor,
      documentId: string,
      patch: Record<string, unknown>,
      slug?: string
    ) => updateContacto(repo, actor, documentId, patch, slug),
    updatePlantilla: (actor: CrmActor, input: CrmPlantillaInput, slug?: string) =>
      updatePlantilla(repo, actor, input, slug),
    subirPieza: (actor: CrmActor, input: { slotIndex: number; file: any; slug?: string }) =>
      subirPieza(strapi, repo, actor, input),
    quitarPieza: (actor: CrmActor, slotIndex: number, slug?: string) =>
      quitarPieza(strapi, repo, actor, slotIndex, slug),
    verPiezaPublica: (token: string) => verPiezaPublica(repo, token),
    enviarWhatsapp: (
      actor: CrmActor,
      contactoDocumentId: string,
      slug?: string,
      plantillaIndex?: unknown
    ) => enviarWhatsapp(repo, actor, contactoDocumentId, slug, plantillaIndex),
    enviarMail: (
      actor: CrmActor,
      contactoDocumentId: string,
      slug?: string,
      plantillaIndex?: unknown
    ) => enviarMail(strapi, repo, actor, contactoDocumentId, slug, plantillaIndex),
    crearFicha: (
      actor: CrmActor,
      contactoDocumentId: string,
      categoriaId?: string,
      slug?: string,
      email?: string
    ) => crearFicha(strapi, repo, actor, contactoDocumentId, categoriaId, slug, email),
    listAlcanzados: (actor: CrmActor, slug?: string) => listAlcanzados(repo, actor, slug),
    listNotas: (actor: CrmActor, documentId: string, slug?: string) =>
      listNotas(repo, actor, documentId, slug),
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
    plantilla: mapCrmPlantilla(plantilla),
    piezas: await listPiezasDePlantilla(repo, plantilla.documentId),
    cupo: readCupo(comercio),
    cupoMail: readCupoMail(comercio),
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
  const nombre = String(input.nombre || '').trim();
  if (!nombre) {
    throw new ValidationError('nombre es requerido');
  }
  return insertContacto(repo, comercio.documentId, { ...input, nombre }, 'manual');
}

async function ingest(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  payload: string,
  slug?: string
) {
  let items;
  try {
    items = parseCrmIngestPayload(payload);
  } catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : 'JSON inválido');
  }
  const { comercio } = await loadTenant(repo, actor, slug);
  const fichas = await createNegocioRepository(strapi).listTelefonos();
  const resultados = [];
  for (const item of items) {
    const creado = await insertContacto(repo, comercio.documentId, item, 'lista_ia');
    resultados.push(await aplicarFichaPreexistente(repo, creado, fichas));
  }
  return {
    creados: resultados.filter((r) => r.status === 'creado').length,
    duplicados: resultados.filter((r) => r.status === 'duplicado').length,
    enlazadas: resultados.filter((r) => r.vinculada).length,
    resultados,
  };
}

async function aplicarFichaPreexistente(
  repo: CrmRepository,
  result: { status: 'creado' | 'duplicado'; contacto: any },
  fichas: Parameters<typeof fichaPorTelefono>[0]
) {
  const documentId = result.contacto?.documentId;
  if (!documentId) return { ...result, vinculada: false };
  const row = await repo.findContacto(documentId);
  if (negocioResumen(row)?.documentId) {
    return { ...result, vinculada: false, contacto: mapCrmContacto(row) };
  }
  const ficha = fichaPorTelefono(fichas, row?.telefono);
  if (!ficha?.documentId) {
    return { ...result, vinculada: false, contacto: mapCrmContacto(row) };
  }
  const categoria = ficha.categoriaId || categoriaIdOf(row);
  await repo.updateContacto(
    documentId,
    categoria ? patchContactoTrasFicha(categoria, ficha.documentId) : { negocio: ficha.documentId }
  );
  await repo.createActividad({
    tipo: 'nota',
    canal: 'sistema',
    texto: `Ficha existente enlazada: ${ficha.slug || ficha.nombre}`,
    contacto: documentId,
  });
  return {
    ...result,
    vinculada: true,
    contacto: mapCrmContacto(await repo.findContacto(documentId)),
  };
}

async function updatePlantilla(
  repo: CrmRepository,
  actor: CrmActor,
  input: CrmPlantillaInput,
  slug?: string
) {
  const { plantilla } = await loadTenant(repo, actor, slug);
  const updated = await repo.updatePlantilla(plantilla.documentId, plantillaSavePayload(input));
  await syncPiezaTitulos(repo, updated);
  return mapCrmPlantilla(updated);
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
  if (patch.email != null) {
    data.email = String(patch.email).trim();
    data.email_normalizado = normalizeCrmEmail(data.email);
  }
  if (patch.instagram != null) data.instagram = String(patch.instagram).trim();
  if (patch.categoriaId != null) {
    const categoriaId = String(patch.categoriaId).trim();
    data.categoria = categoriaId || null;
  }
  await repo.updateContacto(documentId, data);
  if (typeof data.nota === 'string' && data.nota.trim() && data.nota !== (row.nota || '')) {
    await repo.createActividad({
      tipo: 'nota',
      canal: 'sistema',
      texto: data.nota.trim(),
      contacto: documentId,
    });
  }
  if (typeof data.estado === 'string') {
    await refundCupoSiErrorHoy(repo, comercio, row, data.estado);
    await refundCupoMailSiErrorHoy(repo, comercio, row, data.estado);
  }
  const saved = mapCrmContacto(await repo.findContacto(documentId));
  const chosen = patch.categoriaId != null ? String(patch.categoriaId).trim() : '';
  if (saved && chosen && !saved.categoriaId) saved.categoriaId = chosen;
  return saved;
}

async function refundCupoSiErrorHoy(
  repo: CrmRepository,
  comercio: any,
  contacto: any,
  toEstado: string
) {
  const today = calendarDateInTimeZone();
  const acts = await repo.listActividades(contacto.documentId);
  const next = cupoTrasErrorWsp({
    fromEstado: String(contacto.estado || ''),
    toEstado,
    today,
    storedFecha: asDateOnly(comercio.cupo_wsp_fecha),
    storedCount: Number(comercio.cupo_wsp_count || 0),
    ...resumenCupoActividades(acts || [], today),
  });
  if (next == null) return;
  await repo.updateComercio(comercio.documentId, {
    cupo_wsp_fecha: today,
    cupo_wsp_count: next,
  });
  await repo.createActividad({
    tipo: 'estado',
    canal: 'sistema',
    texto: CUPO_DEVUELTO_TEXTO,
    contacto: contacto.documentId,
  });
}

async function refundCupoMailSiErrorHoy(
  repo: CrmRepository,
  comercio: any,
  contacto: any,
  toEstado: string
) {
  const today = calendarDateInTimeZone();
  const acts = await repo.listActividades(contacto.documentId);
  const next = cupoTrasErrorWsp({
    fromEstado: String(contacto.estado || ''),
    toEstado,
    today,
    storedFecha: asDateOnly(comercio.cupo_mail_fecha),
    storedCount: Number(comercio.cupo_mail_count || 0),
    ...resumenCupoMailActividades(acts || [], today),
  });
  if (next == null) return;
  await repo.updateComercio(comercio.documentId, {
    cupo_mail_fecha: today,
    cupo_mail_count: next,
  });
  await repo.createActividad({
    tipo: 'estado',
    canal: 'sistema',
    texto: CUPO_MAIL_DEVUELTO_TEXTO,
    contacto: contacto.documentId,
  });
}

async function contextoEnvio(
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  slug: string | undefined,
  plantillaIndex: unknown
) {
  const { comercio, plantilla } = await loadTenant(repo, actor, slug);
  const contacto = await repo.findContacto(contactoDocumentId);
  assertContactoInTenant(contacto, comercio.documentId);
  const firma =
    plantilla.firma || (modoOf(comercio) === 'agenda' ? comercio.nombre : DEFAULT_CRM_FIRMA);
  const slot = slotDePlantilla(plantilla, plantillaIndex);
  const pieza = mapCrmPieza(await repo.findPiezaBySlot(plantilla.documentId, slot.plantillaIndex));
  const saludo = greetingNow();
  const texto = composeCrmMensaje({
    saludo,
    nombre: contacto.nombre,
    mensaje: slot.texto,
    firma,
    piezaUrl: pieza?.pageUrl || '',
  });
  return { comercio, contacto, slot, texto, pieza, saludo, firma };
}

async function enviarWhatsapp(
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  slug?: string,
  plantillaIndex?: unknown
) {
  const { comercio, contacto, slot, texto } = await contextoEnvio(
    repo,
    actor,
    contactoDocumentId,
    slug,
    plantillaIndex
  );
  assertPuedeEnviarWhatsapp(contacto, modoOf(comercio));
  const whatsappUrl = buildWhatsappUrl(contacto.telefono, texto);
  const hasUrl = Boolean(whatsappUrl);
  const cupoActual = readCupo(comercio);
  if (hasUrl && cupoLleno(cupoActual)) {
    throw new ValidationError(`Llegaste al cupo CRM de ${cupoActual.limite} WhatsApp de hoy`);
  }
  await repo.updateContacto(contacto.documentId, patchTrasWhatsapp(contacto.estado, hasUrl));
  await repo.createActividad({
    tipo: 'envio_whatsapp',
    canal: 'whatsapp',
    texto: hasUrl ? texto : `${CRM_WSP_NO_ENVIADO} teléfono inválido. ${texto}`,
    campana: slot.campana,
    plantilla_index: slot.plantillaIndex,
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

function mailListo(input: {
  to: string;
  slot: { campana: string };
  mensaje: string;
  texto: string;
  saludo: string;
  firma: string;
  nombre: string;
  pieza: any;
}) {
  return {
    to: input.to,
    subject: asuntoDeCampana(input.slot.campana),
    html: renderCrmMailHtml({
      saludo: input.saludo,
      nombre: input.nombre,
      mensaje: input.mensaje,
      firma: input.firma,
      pieza: input.pieza,
    }),
    text: input.texto,
  };
}

async function enviarMail(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  slug?: string,
  plantillaIndex?: unknown
) {
  const { comercio, contacto, slot, texto, pieza, saludo, firma } = await contextoEnvio(
    repo,
    actor,
    contactoDocumentId,
    slug,
    plantillaIndex
  );
  assertPuedeEnviarMail(contacto, modoOf(comercio));
  const to = normalizeCrmEmail(contacto.email);
  if (!to) return cerrarMailInvalido(repo, comercio, contacto, slot, texto);
  const cupoActual = readCupoMail(comercio);
  if (cupoLleno(cupoActual)) {
    throw new ValidationError(`Llegaste al cupo CRM de ${cupoActual.limite} mails de hoy`);
  }
  const listo = mailListo({
    to,
    slot,
    mensaje: slot.texto,
    texto,
    saludo,
    firma,
    nombre: contacto.nombre,
    pieza,
  });
  const mailAbierto = await prepararBorrador(listo);
  return registrarMailEnviado(
    repo,
    comercio,
    contacto,
    slot,
    texto,
    to,
    mailAbierto,
    listo.subject,
    listo.html
  );
}

async function registrarMailEnviado(
  repo: CrmRepository,
  comercio: any,
  contacto: any,
  slot: { campana: string; plantillaIndex: number },
  texto: string,
  to: string,
  mailAbierto: boolean,
  subject: string,
  html: string
) {
  await repo.updateContacto(contacto.documentId, patchTrasWhatsapp(contacto.estado, true));
  await repo.createActividad({
    tipo: 'envio_email',
    canal: 'email',
    texto,
    campana: slot.campana,
    plantilla_index: slot.plantillaIndex,
    contacto: contacto.documentId,
  });
  const aviso = `Borrador abierto en Mail para ${to}, con tu cuenta. El botón es Enviar.`;
  return {
    enviado: true,
    texto,
    to,
    subject,
    html,
    mailAbierto,
    cupoMail: await bumpCupoMail(repo, comercio),
    aviso,
    contacto: mapCrmContacto(await repo.findContacto(contacto.documentId)),
  };
}

async function cerrarMailInvalido(
  repo: CrmRepository,
  comercio: any,
  contacto: any,
  slot: { campana: string; plantillaIndex: number },
  texto: string
) {
  await repo.updateContacto(contacto.documentId, patchTrasWhatsapp(contacto.estado, false));
  await repo.createActividad({
    tipo: 'envio_email',
    canal: 'email',
    texto: `${CRM_MAIL_NO_ENVIADO} email inválido. ${texto}`,
    campana: slot.campana,
    plantilla_index: slot.plantillaIndex,
    contacto: contacto.documentId,
  });
  return {
    enviado: false,
    texto,
    cupoMail: readCupoMail(comercio),
    aviso: avisoMailSinUrl(false),
    contacto: mapCrmContacto(await repo.findContacto(contacto.documentId)),
  };
}

async function prepararBorrador(input: { to: string; subject: string; html: string }) {
  if (process.platform !== 'darwin') return false;
  try {
    await abrirBorradorMail(input);
    return true;
  } catch (err) {
    const raw = err instanceof Error ? err.message : '';
    const denied = /-1743|not authorized|autoriz/i.test(raw);
    const message = denied
      ? 'Mail no dejó abrir el borrador. Aceptá el permiso y volvé a pulsar Mail. El contacto sigue en la cola.'
      : 'No se pudo abrir el borrador en Mail. El contacto sigue en la cola.';
    throw new ValidationError(message);
  }
}

async function crearFicha(
  strapi: any,
  repo: CrmRepository,
  actor: CrmActor,
  contactoDocumentId: string,
  categoriaId?: string,
  slug?: string,
  email?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  assertGuiaPuedePublicar(actor, comercio);
  const contacto = await repo.findContacto(contactoDocumentId);
  assertContactoInTenant(contacto, comercio.documentId);
  const ya = negocioResumen(contacto);
  if (ya?.documentId) {
    return { created: false, vinculada: false, contacto: mapCrmContacto(contacto), negocio: ya };
  }
  const categoria = String(categoriaId || categoriaIdOf(contacto) || '').trim();
  const existente = fichaPorTelefono(
    await createNegocioRepository(strapi).listTelefonos(),
    contacto.telefono
  );
  if (existente?.documentId) {
    return cerrarConFicha(repo, contacto.documentId, existente, categoria, false);
  }
  const emailFicha =
    mailDeFicha(contacto.email) ||
    mailDeFicha(contacto.email_normalizado) ||
    mailDeFicha(email);
  assertFichaMinima({
    nombre: contacto.nombre,
    telefono: contacto.telefono,
    email: emailFicha,
    categoriaId: categoria,
  });
  const negocio = await adminCreateNegocio(strapi, {
    nombre: contacto.nombre,
    categoriaId: categoria,
    telefono: contacto.telefono,
    email: emailFicha,
  });
  return cerrarConFicha(repo, contacto.documentId, negocio, categoria, true);
}

async function cerrarConFicha(
  repo: CrmRepository,
  contactoDocumentId: string,
  negocio: { documentId: string; slug: string; nombre: string },
  categoria: string,
  created: boolean
) {
  const patch = categoria
    ? patchContactoTrasFicha(categoria, negocio.documentId)
    : { negocio: negocio.documentId };
  await repo.updateContacto(contactoDocumentId, patch);
  await repo.createActividad({
    tipo: 'nota',
    canal: 'sistema',
    texto: created
      ? `Ficha publicada: ${negocio.slug}`
      : `Ficha existente enlazada: ${negocio.slug || negocio.nombre}`,
    contacto: contactoDocumentId,
  });
  return {
    created,
    vinculada: !created,
    contacto: mapCrmContacto(await repo.findContacto(contactoDocumentId)),
    negocio,
  };
}

async function listAlcanzados(repo: CrmRepository, actor: CrmActor, slug?: string) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const rows = await repo.listEnvios(comercio.documentId);
  return foldAlcanzados(rows);
}

async function listNotas(
  repo: CrmRepository,
  actor: CrmActor,
  documentId: string,
  slug?: string
) {
  const { comercio } = await loadTenant(repo, actor, slug);
  const row = await repo.findContacto(documentId);
  assertContactoInTenant(row, comercio.documentId);
  const acts = await repo.listActividades(documentId);
  return mapNotaActividades(acts || []);
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
