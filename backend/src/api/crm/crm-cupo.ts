import { calendarDateInTimeZone } from '../../utils/prospeccion-saludo';
import { actividadConsumioCupo } from './crm-enviar';
import {
  WHATSAPP_DAILY_LIMIT,
  asDateOnly,
  nextCupoCount,
  resolveCupoWhatsapp,
  type CupoWhatsapp,
} from '../prospeccion/prospeccion-cupo';

export { WHATSAPP_DAILY_LIMIT, asDateOnly, nextCupoCount, resolveCupoWhatsapp };
export type { CupoWhatsapp };

export const CUPO_DEVUELTO_TEXTO = 'Cupo CRM: se descontó 1 envío (Error WSP del día).';

export function cupoFromComercio(
  doc: { cupo_wsp_fecha?: unknown; cupo_wsp_count?: unknown; cupo_wsp_limite?: unknown } | null,
  today: string
): CupoWhatsapp {
  const base = resolveCupoWhatsapp({
    storedFecha: asDateOnly(doc?.cupo_wsp_fecha),
    storedCount: Number(doc?.cupo_wsp_count || 0),
    today,
    contactosHoy: 0,
  });
  const limite = Math.max(1, Number(doc?.cupo_wsp_limite) || WHATSAPP_DAILY_LIMIT);
  return { ...base, limite };
}

export function activityCalendarDay(value: unknown): string | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return asDateOnly(value);
  return calendarDateInTimeZone(d);
}

export function resumenCupoActividades(
  rows: { tipo?: string; texto?: string; createdAt?: unknown }[],
  today: string
) {
  let enviosQueConsumieronHoy = 0;
  let devolucionesHoy = 0;
  for (const row of rows || []) {
    if (activityCalendarDay(row.createdAt) !== today) continue;
    if (row.tipo === 'envio_whatsapp' && actividadConsumioCupo(row.texto)) {
      enviosQueConsumieronHoy += 1;
    }
    if (row.tipo === 'estado' && row.texto === CUPO_DEVUELTO_TEXTO) {
      devolucionesHoy += 1;
    }
  }
  return { enviosQueConsumieronHoy, devolucionesHoy };
}

export function cupoTrasErrorWsp(input: {
  fromEstado: string;
  toEstado: string;
  today: string;
  storedFecha: string | null;
  storedCount: number;
  enviosQueConsumieronHoy: number;
  devolucionesHoy: number;
}): number | null {
  if (input.toEstado !== 'error' || input.fromEstado === 'error') return null;
  if (input.storedFecha !== input.today) return null;
  if (input.enviosQueConsumieronHoy <= input.devolucionesHoy) return null;
  const count = Math.max(0, Number(input.storedCount) || 0);
  if (count === 0) return null;
  return count - 1;
}
