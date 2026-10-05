export type OfertaFechas = {
  valida_desde?: string | Date | null;
  valida_hasta?: string | Date | null;
  vigencia_permanente?: boolean | null;
};

export type OfertaVigenciaEstado = "programada" | "vigente" | "vencida" | "permanente";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True si la vigencia es permanente o si ahora cae dentro de [valida_desde, valida_hasta]. */
export function isOfertaEnVentana(oferta: OfertaFechas, now: Date = new Date()): boolean {
  if (oferta.vigencia_permanente) return true;
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (!desde || !hasta) return false;
  const t = now.getTime();
  return t >= desde.getTime() && t <= hasta.getTime();
}

export function ofertaVigenciaEstado(oferta: OfertaFechas, now: Date = new Date()): OfertaVigenciaEstado {
  if (oferta.vigencia_permanente) return "permanente";
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (desde && now.getTime() < desde.getTime()) return "programada";
  if (hasta && now.getTime() > hasta.getTime()) return "vencida";
  if (desde && hasta) return "vigente";
  return "vencida";
}

export function strapiOfertaVigenteFilters(now: Date = new Date()): string {
  const iso = encodeURIComponent(now.toISOString());
  return [
    "filters[$or][0][vigencia_permanente][$eq]=true",
    `filters[$or][1][valida_desde][$lte]=${iso}`,
    `filters[$or][1][valida_hasta][$gte]=${iso}`,
  ].join("&");
}
