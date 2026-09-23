import { ValidationError } from '../../../utils/errors';
import { isTripadvisorHostname, normalizeHttpUrl } from '../../../utils/safe-url';

const ALWAYS_FORBIDDEN = [
  'owner',
  'slug',
  'documentId',
  'id',
  'estado_reclamo',
  'publishedAt',
  'documentacion_reclamo',
  'google_reviews',
  'google_reviews_synced_at',
  'pagos',
  'views',
  'clicks_whatsapp',
  'clicks_website',
  'rating',
  'review_count',
  'verificado',
  'reclamar_habilitado',
  'premium_notes',
  'premium_since',
] as const;

const ADMIN_ONLY = ['is_premium', 'premium_valid_until', 'is_prospector', 'prospector_valid_until'] as const;

const HTTP_URL_FIELDS = [
  'website',
  'facebook',
  'google_maps_url',
  'youtube_url',
  'cta_link',
  'reserva_url',
] as const;

function applyHttpUrlField(data: Record<string, unknown>, field: string) {
  if (!(field in data)) return;
  const value = data[field];
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return;
  }
  const parsed = normalizeHttpUrl(value);
  if (!parsed.ok) {
    throw new ValidationError(`URL inválida en ${field}`);
  }
  data[field] = parsed.url;
}

export function sanitizePortalUpdatePayload(
  data: Record<string, unknown>,
  isAdmin: boolean
): Record<string, unknown> {
  const updateData = { ...data };
  for (const field of ALWAYS_FORBIDDEN) {
    delete updateData[field];
  }
  if (!isAdmin) {
    for (const field of ADMIN_ONLY) {
      delete updateData[field];
    }
  }

  for (const field of HTTP_URL_FIELDS) {
    applyHttpUrlField(updateData, field);
  }

  if ('tripadvisor_url' in updateData) {
    const parsed = normalizeHttpUrl(updateData.tripadvisor_url);
    if (!parsed.ok) throw new ValidationError('URL de TripAdvisor inválida');
    if (parsed.url) {
      const host = new URL(parsed.url).hostname;
      if (!isTripadvisorHostname(host)) {
        throw new ValidationError('URL de TripAdvisor inválida');
      }
      if (new URL(parsed.url).protocol !== 'https:') {
        throw new ValidationError('URL de TripAdvisor inválida');
      }
    }
    updateData.tripadvisor_url = parsed.url;
  }

  return updateData;
}
