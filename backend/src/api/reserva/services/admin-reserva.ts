import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';
import { createReservaRepository } from '../repositories/reserva-repository';
import { createReservaBloqueoRepository } from '../../reserva-bloqueo/repositories/reserva-bloqueo-repository';
import { getDisponibilidad, expireStaleHolds } from '../../reserva-comercio/services/disponibilidad';
import { addDaysToDateStr, wallClockToUtc } from '../../reserva-comercio/services/slot-time';

async function loadComercioOrThrow(strapi: any, slug: string) {
  const repo = createReservaComercioRepository(strapi);
  const comercio = await repo.findBySlug(slug.trim(), {
    recursos: { sort: ['orden:asc'] },
  });
  if (!comercio || comercio.activo === false) {
    throw new NotFoundError('Comercio de reservas');
  }
  return comercio;
}

export async function adminAgenda(strapi: any, slug: string, query: { fecha?: string; dias?: number }) {
  await expireStaleHolds(strapi);
  const disponibilidad = await getDisponibilidad(strapi, slug, query);

  const comercio = await loadComercioOrThrow(strapi, slug);
  const timeZone = comercio.timezone || 'America/Argentina/Mendoza';
  const fechaInicio = disponibilidad.desde;
  const [y0, m0, d0] = fechaInicio.split('-').map(Number);
  const rangeStart = wallClockToUtc(y0, m0, d0, 0, 0, timeZone);
  const endDate = disponibilidad.dias[disponibilidad.dias.length - 1]?.fecha || fechaInicio;
  const exclusiveEnd = addDaysToDateStr(endDate, 1);
  const [y1, m1, d1] = exclusiveEnd.split('-').map(Number);
  const rangeEnd = wallClockToUtc(y1, m1, d1, 0, 0, timeZone);

  const reservaRepo = createReservaRepository(strapi);
  const bloqueoRepo = createReservaBloqueoRepository(strapi);

  const [reservas, bloqueos] = await Promise.all([
    reservaRepo.findOccupyingInRange({
      comercioDocumentId: comercio.documentId,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
    }),
    bloqueoRepo.findInRange({
      comercioDocumentId: comercio.documentId,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
    }),
  ]);

  // Incluir también canceladas recientes no hace falta para agenda operativa
  const allReservas = await strapi.documents('api::reserva.reserva').findMany({
    filters: {
      comercio: { documentId: { $eq: comercio.documentId } },
      inicio: { $lt: rangeEnd.toISOString() },
      fin: { $gt: rangeStart.toISOString() },
      estado: { $in: ['hold', 'confirmada', 'cancelada'] },
    },
    populate: { recurso: true },
    sort: ['inicio:asc'],
  });

  return {
    ...disponibilidad,
    reservas: allReservas.map((r: any) => ({
      documentId: r.documentId,
      codigo: r.codigo,
      estado: r.estado,
      origen: r.origen,
      inicio: r.inicio,
      fin: r.fin,
      cliente_nombre: r.cliente_nombre,
      cliente_email: r.cliente_email,
      cliente_telefono: r.cliente_telefono,
      monto_ars: r.monto_ars,
      excepcion_sin_pago: r.excepcion_sin_pago,
      mp_payment_id: r.mp_payment_id || null,
      mp_refund_id: r.mp_refund_id || null,
      recurso: r.recurso
        ? { documentId: r.recurso.documentId, nombre: r.recurso.nombre }
        : null,
    })),
    bloqueos: (bloqueos || []).map((b: any) => ({
      documentId: b.documentId,
      inicio: b.inicio,
      fin: b.fin,
      motivo: b.motivo,
      recurso: b.recurso
        ? { documentId: b.recurso.documentId, nombre: b.recurso.nombre }
        : null,
    })),
    // hold vigentes ya vienen en findOccupying; kept for clarity
    holds_activos: reservas.filter((r: any) => r.estado === 'hold').length,
  };
}

export async function adminWalkIn(
  strapi: any,
  slug: string,
  input: {
    recursoDocumentId: string;
    inicio: string;
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    excepcion_sin_pago?: boolean;
  }
) {
  await expireStaleHolds(strapi);
  const comercio = await loadComercioOrThrow(strapi, slug);

  if (!input.recursoDocumentId) throw new ValidationError('recursoDocumentId es requerido');
  if (!input.inicio) throw new ValidationError('inicio es requerido');
  if (!input.cliente_nombre?.trim()) throw new ValidationError('cliente_nombre es requerido');

  const recurso = (comercio.recursos || []).find(
    (r: any) => r.documentId === input.recursoDocumentId && r.activo !== false
  );
  if (!recurso) throw new ValidationError('Recurso no válido');

  const inicio = new Date(input.inicio);
  if (Number.isNaN(inicio.getTime())) throw new ValidationError('inicio inválido');

  const duracion = Number(comercio.duracion_minutos) || 60;
  const bufferMin = Number(comercio.buffer_limpieza_minutos) || 0;
  const fin = new Date(inicio.getTime() + duracion * 60_000);

  const reservaRepo = createReservaRepository(strapi);
  const ocupaciones = await reservaRepo.findOccupyingInRange({
    comercioDocumentId: comercio.documentId,
    recursoDocumentId: recurso.documentId,
    rangeStart: inicio.toISOString(),
    rangeEnd: new Date(fin.getTime() + bufferMin * 60_000).toISOString(),
  });

  const now = Date.now();
  const conflict = ocupaciones.some((r: any) => {
    if (r.estado === 'hold' && r.hold_expires_at && new Date(r.hold_expires_at).getTime() <= now) {
      return false;
    }
    return true;
  });
  if (conflict) throw new ValidationError('Ese hueco ya no está disponible');

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = 'JD-';
  for (let i = 0; i < 6; i++) codigo += alphabet[Math.floor(Math.random() * alphabet.length)];

  const created = await reservaRepo.create({
    codigo,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: 'confirmada',
    origen: 'walk_in',
    cliente_nombre: input.cliente_nombre.trim(),
    cliente_email: input.cliente_email?.trim().toLowerCase() || null,
    cliente_telefono: input.cliente_telefono?.trim() || null,
    monto_ars: Number(comercio.precio_ars) || 0,
    excepcion_sin_pago: input.excepcion_sin_pago !== false,
    comercio: comercio.documentId,
    recurso: recurso.documentId,
  });

  if (created.cliente_email) {
    try {
      const { sendReservaConfirmacionMail } = await import('./cancel-reserva');
      await sendReservaConfirmacionMail(strapi, created.documentId);
    } catch (err: any) {
      strapi.log.warn(`[ReservaAdmin] Mail walk-in falló: ${err.message}`);
    }
  }

  return created;
}

export async function adminCreateBloqueo(
  strapi: any,
  slug: string,
  input: {
    inicio: string;
    fin: string;
    motivo?: string;
    recursoDocumentId?: string | null;
  }
) {
  const comercio = await loadComercioOrThrow(strapi, slug);
  if (!input.inicio || !input.fin) throw new ValidationError('inicio y fin son requeridos');
  const inicio = new Date(input.inicio);
  const fin = new Date(input.fin);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
    throw new ValidationError('rango de bloqueo inválido');
  }

  if (input.recursoDocumentId) {
    const ok = (comercio.recursos || []).some((r: any) => r.documentId === input.recursoDocumentId);
    if (!ok) throw new ValidationError('Recurso no válido');
  }

  return strapi.documents('api::reserva-bloqueo.reserva-bloqueo').create({
    data: {
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      motivo: input.motivo?.trim() || 'Bloqueo admin',
      comercio: comercio.documentId,
      recurso: input.recursoDocumentId || null,
    },
  });
}

export async function adminDeleteBloqueo(strapi: any, slug: string, bloqueoDocumentId: string) {
  const comercio = await loadComercioOrThrow(strapi, slug);
  const row = await strapi.documents('api::reserva-bloqueo.reserva-bloqueo').findOne({
    documentId: bloqueoDocumentId,
    populate: { comercio: true },
  });
  if (!row || row.comercio?.documentId !== comercio.documentId) {
    throw new NotFoundError('Bloqueo');
  }
  await strapi.documents('api::reserva-bloqueo.reserva-bloqueo').delete({
    documentId: bloqueoDocumentId,
  });
  return { deleted: true };
}

export async function adminCancelReserva(strapi: any, slug: string, reservaDocumentId: string) {
  const { cancelReserva } = await import('./cancel-reserva');
  return cancelReserva({
    strapi,
    reservaDocumentId,
    actor: 'admin',
    comercioSlug: slug,
  });
}

export async function adminListComercios(strapi: any, user?: { id: number } | null, asAdmin = false) {
  const filters: Record<string, unknown> = { activo: { $eq: true } };
  if (!asAdmin && user?.id) {
    filters.negocio = { owner: { id: { $eq: user.id } } };
  } else if (!asAdmin) {
    return [];
  }

  const rows = await strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
    filters,
    fields: [
      'nombre',
      'nombre_publico',
      'slug',
      'precio_ars',
      'duracion_minutos',
      'modo_simulacion',
    ],
    populate: {
      recursos: { fields: ['nombre', 'orden', 'activo'] },
      negocio: { fields: ['documentId', 'slug', 'nombre'] },
    },
    sort: ['nombre:asc'],
  });
  return rows;
}
