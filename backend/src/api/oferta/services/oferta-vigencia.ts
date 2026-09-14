export type OfertaFechas = {
  valida_desde?: string | Date | null;
  valida_hasta?: string | Date | null;
};

export type OfertaVigenciaRow = OfertaFechas & {
  documentId?: string;
  activa?: boolean;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True si `now` cae dentro de [valida_desde, valida_hasta]. Sin ambas fechas, no está vigente. */
export function isOfertaEnVentana(oferta: OfertaFechas, now: Date = new Date()): boolean {
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (!desde || !hasta) return false;
  const t = now.getTime();
  return t >= desde.getTime() && t <= hasta.getTime();
}

export function stampActivaOnPayload(
  data: Record<string, any> | undefined,
  existing?: OfertaFechas | null
): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') return data;
  data.activa = isOfertaEnVentana({
    valida_desde: (data.valida_desde ?? existing?.valida_desde) as OfertaFechas['valida_desde'],
    valida_hasta: (data.valida_hasta ?? existing?.valida_hasta) as OfertaFechas['valida_hasta'],
  });
  return data;
}

export function mergePublicVigenciaFilters(filters: unknown, now: Date = new Date()) {
  const base =
    filters && typeof filters === 'object' && !Array.isArray(filters)
      ? { ...(filters as Record<string, unknown>) }
      : {};
  const iso = now.toISOString();
  return {
    ...base,
    valida_desde: { $lte: iso },
    valida_hasta: { $gte: iso },
  };
}

export function planVigenciaUpdates(ofertas: OfertaVigenciaRow[], now: Date = new Date()) {
  const updates: { documentId: string; activa: boolean }[] = [];
  for (const oferta of ofertas) {
    if (!oferta.documentId) continue;
    const activa = isOfertaEnVentana(oferta, now);
    if (Boolean(oferta.activa) === activa) continue;
    updates.push({ documentId: oferta.documentId, activa });
  }
  return updates;
}

export function shouldAutoPublish(
  result: { documentId?: string; publishedAt?: unknown } | null | undefined,
  publishing: Set<string>
): boolean {
  const documentId = result?.documentId ? String(result.documentId) : '';
  if (!documentId) return false;
  if (result?.publishedAt) return false;
  if (publishing.has(documentId)) return false;
  return true;
}
