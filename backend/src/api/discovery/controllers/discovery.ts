
import { factories } from '@strapi/strapi';
import { DiscoveryService } from '../../../services/discovery-service';

const discoveryService = new DiscoveryService();

/**
 * Parses Google Maps hours text into structured Strapi schedules.
 *
 * Supports two formats returned by Google Maps:
 *   1. Colon-separated 24h (from page text):     "lunes: 12:00–23:00; martes: 12:00–23:00"
 *   2. Comma-separated 12h (from aria-labels):   "lunes, 12:00 p. m. a 11:00 p. m.; martes, 12:00 p. m. a 11:00 p. m."
 *
 * The previous implementation broke on format 2 because split(';|,') would separate
 * "lunes" from its time range, leaving the day without hours and the hours without a day.
 */
function parseGoogleHours(hoursText: string) {
  if (!hoursText) return [];

  const daysMapping: { [key: string]: string } = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'domingo': 'Domingo'
  };

  // Normalize non-breaking spaces and zero-width characters inserted by Google
  const normalized = hoursText
    .replace(/[\u00a0\u200b\u202f]/g, ' ')  // NBSP, zero-width space, narrow NBSP → space
    .replace(/\s+/g, ' ')
    .trim();

  // Split ONLY on semicolons (our joiner) — never on commas,
  // because Google's 12h format uses "día, HH:MM a.m. a HH:MM p.m."
  const segments = normalized.split(';').map(s => s.trim()).filter(s => s.length > 0);

  const schedules: any[] = [];

  const dayPattern = /(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i;

  /**
   * Converts a time token to "HH:MM:00.000" format.
   * Handles both 24h ("14:30") and 12h ("2:30 p. m.").
   */
  function normalizeTime(timeStr: string, meridiem: string | null): string {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (meridiem) {
      const isPM = meridiem.toLowerCase().replace(/[^apm]/g, '').startsWith('p');
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000`;
  }

  for (const segment of segments) {
    const dayMatch = segment.match(dayPattern);
    if (!dayMatch) continue;

    const dayKey = dayMatch[0].toLowerCase()
      .replace('miercoles', 'miércoles')
      .replace('sabado', 'sábado');
    const day = daysMapping[dayKey];
    if (!day) continue;

    if (segment.toLowerCase().includes('cerrado')) {
      schedules.push({ day, is_closed: true, opening_time: null, closing_time: null });
      continue;
    }

    // --- 12h ranges (handles split shifts via matchAll) ---
    // Minutes optional: \d{1,2}(?::\d{2})?
    // Separators: en-dash OR space-a-space
    // Covers: "11 a.m.–3:30 p.m."  "7 p.m.–1 a.m."  "12:00 p. m. a 11:00 p. m."
    const RANGE_12H = /(\d{1,2}(?::\d{2})?)\s*([aApP][.\s]*[mM][.\s]*)\s*(?:[-\u2013\u2014]|a\s+)(\d{1,2}(?::\d{2})?)\s*([aApP][.\s]*[mM][.\s]*)/g;
    const ranges12h = [...segment.matchAll(RANGE_12H)];
    if (ranges12h.length > 0) {
      const first = ranges12h[0];
      const last  = ranges12h.at(-1)!;
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(first[1], first[2]),
        closing_time: normalizeTime(last[3],  last[4]),
      });
      continue;
    }

    // --- 24h range "12:00–23:00" ---
    const match24h = segment.match(/(\d{1,2}:\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}:\d{2})/);
    if (match24h) {
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(match24h[1], null),
        closing_time: normalizeTime(match24h[2], null),
      });
      continue;
    }

    // --- Plain "HH:MM a HH:MM" (24h, no meridiem) ---
    const matchPlain = segment.match(/(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})/);
    if (matchPlain) {
      schedules.push({
        day,
        is_closed: false,
        opening_time: normalizeTime(matchPlain[1], null),
        closing_time: normalizeTime(matchPlain[2], null),
      });
    }
  }

  return schedules;
}

export default {
  async googleSync(ctx) {
    const { name } = ctx.request.body;

    if (!name) {
      return ctx.badRequest('Business name is required');
    }

    try {
      console.log(`[DiscoveryController] Starting sync for: ${name}`);
      const result = await discoveryService.discover(name);

      if (!result.success) {
        return ctx.send({
          success: false,
          error: result.error || 'No se pudo encontrar el negocio en Google Maps'
        });
      }

      // The service now returns rich data inside a 'data' object
      const discoveryData = result.data || {};
      
      const structuredSchedules = discoveryData.schedules?.length
        ? discoveryData.schedules
        : (discoveryData.horarios_texto ? parseGoogleHours(discoveryData.horarios_texto) : []);

      console.log(`[DiscoveryController] Returning ${structuredSchedules.length} schedule entries for: ${name}`);

      return ctx.send({
        success: true,
        data: {
          ...result.data, // This includes place_id, nombre, direccion, telefono, rating, user_ratings_total, photo_reference, location
          schedules: structuredSchedules,
          raw_hours: result.horarios_texto
        }
      });

    } catch (err: any) {
      strapi.log.error(err);
      return ctx.internalServerError('Error durante la sincronización con Google');
    }
  }
};
