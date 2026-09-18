import {
  WHATSAPP_DAILY_LIMIT,
  asDateOnly,
  nextCupoCount,
  resolveCupoWhatsapp,
  type CupoWhatsapp,
} from '../prospeccion/prospeccion-cupo';

export { WHATSAPP_DAILY_LIMIT, asDateOnly, nextCupoCount, resolveCupoWhatsapp };
export type { CupoWhatsapp };

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
