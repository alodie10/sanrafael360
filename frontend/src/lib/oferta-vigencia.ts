export type OfertaFechas = {
  valida_desde?: string | Date | null;
  valida_hasta?: string | Date | null;
};

export type OfertaVigenciaEstado = "programada" | "vigente" | "vencida";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True si ahora cae dentro de [valida_desde, valida_hasta]. */
export function isOfertaEnVentana(oferta: OfertaFechas, now: Date = new Date()): boolean {
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (!desde || !hasta) return false;
  const t = now.getTime();
  return t >= desde.getTime() && t <= hasta.getTime();
}

export function ofertaVigenciaEstado(oferta: OfertaFechas, now: Date = new Date()): OfertaVigenciaEstado {
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (desde && now.getTime() < desde.getTime()) return "programada";
  if (hasta && now.getTime() > hasta.getTime()) return "vencida";
  if (desde && hasta) return "vigente";
  return "vencida";
}

export function strapiOfertaVigenteFilters(now: Date = new Date()): string {
  const iso = encodeURIComponent(now.toISOString());
  return `filters[valida_desde][$lte]=${iso}&filters[valida_hasta][$gte]=${iso}`;
}
