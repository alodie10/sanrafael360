import { ValidationError } from '../../../utils/errors';
import { normalizeHttpUrl } from '../../../utils/safe-url';

const SCHEDULE_DAYS = new Set([
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]);

export type AdminCreateNegocioInput = {
  nombre?: unknown;
  slug?: unknown;
  categoriaId?: unknown;
  direccion?: unknown;
  telefono?: unknown;
  descripcion?: unknown;
  whatsapp?: unknown;
  website?: unknown;
  google_maps_url?: unknown;
  google_place_id?: unknown;
  google_rating?: unknown;
  google_review_count?: unknown;
  latitud?: unknown;
  longitud?: unknown;
  schedules?: unknown;
};

export function asTrimmed(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function optionalHttps(value: unknown, max: number): string | undefined {
  const normalized = normalizeHttpUrl(value);
  if (!normalized.ok) throw new ValidationError('URL inválida');
  return normalized.url ? normalized.url.slice(0, max) : undefined;
}

export function sanitizeSchedules(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const rows: Array<{
    day: string;
    opening_time: string | null;
    closing_time: string | null;
    is_closed: boolean;
  }> = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const day = String(row.day || '');
    if (!SCHEDULE_DAYS.has(day)) continue;
    rows.push({
      day,
      opening_time: asTrimmed(row.opening_time, 8) || null,
      closing_time: asTrimmed(row.closing_time, 8) || null,
      is_closed: Boolean(row.is_closed),
    });
  }
  return rows.length ? rows : undefined;
}

export function buildAdminCreateExtras(input: AdminCreateNegocioInput) {
  const extras: Record<string, unknown> = {};
  const whatsapp = asTrimmed(input.whatsapp, 40);
  if (whatsapp) extras.whatsapp = whatsapp;
  const website = optionalHttps(input.website, 500);
  if (website) extras.website = website;
  const mapsUrl = optionalHttps(input.google_maps_url, 500);
  if (mapsUrl) extras.google_maps_url = mapsUrl;
  const placeId = asTrimmed(input.google_place_id, 128);
  if (placeId) {
    extras.google_place_id = placeId;
    extras.discovery_pending = false;
  }
  const rating = asOptionalNumber(input.google_rating);
  if (rating != null) extras.google_rating = rating;
  const reviewCount = asOptionalNumber(input.google_review_count);
  if (reviewCount != null) extras.google_review_count = Math.round(reviewCount);
  const latitud = asOptionalNumber(input.latitud);
  if (latitud != null) extras.latitud = latitud;
  const longitud = asOptionalNumber(input.longitud);
  if (longitud != null) extras.longitud = longitud;
  const schedules = sanitizeSchedules(input.schedules);
  if (schedules) extras.schedules = schedules;
  return extras;
}
