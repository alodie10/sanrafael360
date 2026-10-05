import { ValidationError } from '../../../utils/errors';

export type OfertaFechas = {
  valida_desde?: string | Date | null;
  valida_hasta?: string | Date | null;
  vigencia_permanente?: boolean | null;
  formato_visual?: string | null;
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

/** True si la vigencia es permanente o si `now` cae dentro de [valida_desde, valida_hasta]. */
export function isOfertaEnVentana(oferta: OfertaFechas, now: Date = new Date()): boolean {
  if (oferta.vigencia_permanente) return true;
  const desde = toDate(oferta.valida_desde);
  const hasta = toDate(oferta.valida_hasta);
  if (!desde || !hasta) return false;
  const t = now.getTime();
  return t >= desde.getTime() && t <= hasta.getTime();
}

function hasDate(value: unknown): boolean {
  return value != null && value !== '';
}

/** Banners pueden ser permanentes (sin fechas). El resto exige el rango. */
export function applyVigenciaRules(data: Record<string, any>, existing?: OfertaFechas | null) {
  const formato = String(data.formato_visual ?? existing?.formato_visual ?? 'Ficha');
  if (formato !== 'Banners') {
    data.vigencia_permanente = false;
    const desde = data.valida_desde !== undefined ? data.valida_desde : existing?.valida_desde;
    const hasta = data.valida_hasta !== undefined ? data.valida_hasta : existing?.valida_hasta;
    if (!hasDate(desde) || !hasDate(hasta)) {
      throw new ValidationError('Las fechas de validez son obligatorias');
    }
    return data;
  }

  const permanente =
    data.vigencia_permanente !== undefined
      ? Boolean(data.vigencia_permanente)
      : Boolean(existing?.vigencia_permanente);

  if (permanente) {
    data.vigencia_permanente = true;
    data.valida_desde = null;
    data.valida_hasta = null;
    return data;
  }

  data.vigencia_permanente = false;
  const desde = data.valida_desde !== undefined ? data.valida_desde : existing?.valida_desde;
  const hasta = data.valida_hasta !== undefined ? data.valida_hasta : existing?.valida_hasta;
  if (!hasDate(desde) || !hasDate(hasta)) {
    throw new ValidationError('Las fechas de validez son obligatorias, o marcá vigencia permanente.');
  }
  return data;
}

export function stampActivaOnPayload(
  data: Record<string, any> | undefined,
  existing?: OfertaFechas | null
): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') return data;
  const permanente =
    data.vigencia_permanente !== undefined && data.vigencia_permanente !== null
      ? Boolean(data.vigencia_permanente)
      : Boolean(existing?.vigencia_permanente);
  data.activa = isOfertaEnVentana({
    valida_desde: (data.valida_desde ?? existing?.valida_desde) as OfertaFechas['valida_desde'],
    valida_hasta: (data.valida_hasta ?? existing?.valida_hasta) as OfertaFechas['valida_hasta'],
    vigencia_permanente: permanente,
  });
  return data;
}

export function publicVigenciaClause(now: Date = new Date()) {
  const iso = now.toISOString();
  return {
    $or: [
      { vigencia_permanente: { $eq: true } },
      { valida_desde: { $lte: iso }, valida_hasta: { $gte: iso } },
    ],
  };
}

export function mergePublicVigenciaFilters(filters: unknown, now: Date = new Date()) {
  const base =
    filters && typeof filters === 'object' && !Array.isArray(filters)
      ? { ...(filters as Record<string, unknown>) }
      : {};
  const ventana = publicVigenciaClause(now);
  if (Object.keys(base).length === 0) return ventana;
  return { $and: [base, ventana] };
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
