import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createReservaComercioRepository } from '../repositories/reserva-comercio-repository';
import { createReservaRepository } from '../../reserva/repositories/reserva-repository';
import { createReservaBloqueoRepository } from '../../reserva-bloqueo/repositories/reserva-bloqueo-repository';
import {
  addDaysToDateStr,
  formatDateInTimeZone,
  hmToMinutes,
  minutesToHm,
  parseHm,
  wallClockToUtc,
  weekdayFromDateStr,
} from './slot-time';

type HorarioTramo = { inicio: string; fin: string };
type HorarioJson = { dias?: Record<string, HorarioTramo[]> };

export type DisponibilidadQuery = {
  fecha?: string;
  dias?: number;
};

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function mediaUrl(file: any): string | null {
  if (!file) return null;
  const url = file.url || file?.formats?.medium?.url || file?.formats?.small?.url;
  return url || null;
}

export async function expireStaleHolds(strapi: any): Promise<number> {
  const now = new Date().toISOString();
  const stale = await strapi.documents('api::reserva.reserva').findMany({
    filters: {
      estado: { $eq: 'hold' },
      hold_expires_at: { $lt: now },
    },
    limit: 200,
  });

  for (const row of stale) {
    await strapi.documents('api::reserva.reserva').update({
      documentId: row.documentId,
      data: { estado: 'expirada' },
    });
  }
  return stale.length;
}

function buildCandidateSlots(params: {
  dateStr: string;
  horario: HorarioJson;
  duracionMinutos: number;
  timeZone: string;
}): { inicio: Date; fin: Date; labelInicio: string }[] {
  const weekday = weekdayFromDateStr(params.dateStr);
  const tramos = params.horario?.dias?.[String(weekday)] || [];
  const out: { inicio: Date; fin: Date; labelInicio: string }[] = [];

  for (const tramo of tramos) {
    let cursor = hmToMinutes(tramo.inicio);
    const endMin = hmToMinutes(tramo.fin);

    while (cursor + params.duracionMinutos <= endMin) {
      const labelInicio = minutesToHm(cursor);
      const labelFin = minutesToHm(cursor + params.duracionMinutos);
      const startHm = parseHm(labelInicio);
      const endHm = parseHm(labelFin);
      const [y, m, d] = params.dateStr.split('-').map(Number);
      const inicio = wallClockToUtc(y, m, d, startHm.hour, startHm.minute, params.timeZone);
      const fin = wallClockToUtc(y, m, d, endHm.hour, endHm.minute, params.timeZone);
      out.push({ inicio, fin, labelInicio });
      cursor += params.duracionMinutos;
    }
  }

  return out;
}

export async function getDisponibilidad(
  strapi: any,
  slug: string,
  query: DisponibilidadQuery
) {
  if (!slug?.trim()) {
    throw new ValidationError('slug es requerido');
  }

  await expireStaleHolds(strapi);

  const comercioRepo = createReservaComercioRepository(strapi);
  const comercio = await comercioRepo.findBySlug(slug.trim(), {
    logo: true,
    imagen_portada: true,
    recursos: { sort: ['orden:asc'] },
  });

  if (!comercio || comercio.activo === false) {
    throw new NotFoundError('Comercio de reservas');
  }

  const timeZone = comercio.timezone || 'America/Argentina/Mendoza';
  const duracion = Number(comercio.duracion_minutos) || 60;
  const bufferMin = Number(comercio.buffer_limpieza_minutos) || 0;
  const diasCount = Math.min(Math.max(Number(query.dias) || 1, 1), 14);

  const fechaInicio =
    query.fecha && /^\d{4}-\d{2}-\d{2}$/.test(query.fecha)
      ? query.fecha
      : formatDateInTimeZone(new Date(), timeZone);

  const recursos = (comercio.recursos || []).filter((r: any) => r.activo !== false);
  const [y0, m0, d0] = fechaInicio.split('-').map(Number);
  const rangeStart = wallClockToUtc(y0, m0, d0, 0, 0, timeZone);
  const fechaFin = addDaysToDateStr(fechaInicio, diasCount);
  const [y1, m1, d1] = fechaFin.split('-').map(Number);
  const rangeEnd = wallClockToUtc(y1, m1, d1, 0, 0, timeZone);

  const reservaRepo = createReservaRepository(strapi);
  const bloqueoRepo = createReservaBloqueoRepository(strapi);

  const [ocupaciones, bloqueos] = await Promise.all([
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

  const now = Date.now();
  const busy = ocupaciones
    .filter((r: any) => {
      if (r.estado === 'confirmada') return true;
      if (r.estado === 'hold') {
        if (!r.hold_expires_at) return true;
        return new Date(r.hold_expires_at).getTime() > now;
      }
      return false;
    })
    .map((r: any) => ({
      recursoId: r.recurso?.documentId as string | undefined,
      start: new Date(r.inicio).getTime(),
      end: new Date(r.fin).getTime() + bufferMin * 60_000,
    }));

  const blocks = (bloqueos || []).map((b: any) => ({
    recursoId: b.recurso?.documentId as string | undefined | null,
    start: new Date(b.inicio).getTime(),
    end: new Date(b.fin).getTime(),
  }));

  const dias = [];
  for (let i = 0; i < diasCount; i++) {
    const dateStr = addDaysToDateStr(fechaInicio, i);
    const candidates = buildCandidateSlots({
      dateStr,
      horario: comercio.horario || {},
      duracionMinutos: duracion,
      timeZone,
    });

    const slots = candidates.map((c) => {
      const cStart = c.inicio.getTime();
      const cEnd = c.fin.getTime();

      const recursosSlot = recursos.map((recurso: any) => {
        const occupied = busy.some(
          (b) =>
            b.recursoId === recurso.documentId &&
            overlaps(cStart, cEnd, b.start, b.end)
        );
        const blocked = blocks.some(
          (b) =>
            (!b.recursoId || b.recursoId === recurso.documentId) &&
            overlaps(cStart, cEnd, b.start, b.end)
        );
        return {
          documentId: recurso.documentId,
          nombre: recurso.nombre,
          orden: recurso.orden,
          disponible: !occupied && !blocked,
        };
      });

      return {
        inicio: c.inicio.toISOString(),
        fin: c.fin.toISOString(),
        hora: c.labelInicio,
        disponibles: recursosSlot.filter((r) => r.disponible).length,
        recursos: recursosSlot,
      };
    });

    dias.push({ fecha: dateStr, slots });
  }

  return {
    comercio: {
      documentId: comercio.documentId,
      slug: comercio.slug,
      nombre: comercio.nombre,
      nombre_publico: comercio.nombre_publico || comercio.nombre,
      texto_llegada: comercio.texto_llegada,
      anticipacion_llegada_minutos: comercio.anticipacion_llegada_minutos,
      precio_ars: Number(comercio.precio_ars),
      duracion_minutos: duracion,
      buffer_limpieza_minutos: bufferMin,
      timezone: timeZone,
      modo_cobro: comercio.modo_cobro || 'mp_requerido',
      modo_simulacion: Boolean(comercio.modo_simulacion),
      logo_url: mediaUrl(comercio.logo),
      portada_url: mediaUrl(comercio.imagen_portada),
    },
    recursos: recursos.map((r: any) => ({
      documentId: r.documentId,
      nombre: r.nombre,
      orden: r.orden,
    })),
    desde: fechaInicio,
    dias,
  };
}
