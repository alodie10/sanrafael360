
import { factories } from '@strapi/strapi';
import { DiscoveryService } from '../../../services/discovery-service';

const discoveryService = new DiscoveryService();

/**
 * Parses Google Maps hours text into structured Strapi schedules
 * Input example: "lunes: 12:00–23:00, martes: 12:00–23:00, ..."
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

  const schedules: any[] = [];
  // Split by semicolon (our new joiner) or comma (google's default)
  const parts = hoursText.split(/;|,/).map(p => p.trim()).filter(p => p.length > 0);

  parts.forEach(part => {
    // Detect day name
    const dayMatch = part.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
    if (!dayMatch) return;

    const dayNameRaw = dayMatch[0].toLowerCase();
    const day = daysMapping[dayNameRaw];
    if (!day) return;

    if (part.toLowerCase().includes('cerrado')) {
      schedules.push({
        day,
        is_closed: true,
        opening_time: null,
        closing_time: null
      });
      return;
    }

    // Capture time range: support "12:00-23:00", "12:00 a 23:00", and various dashes
    const timeMatch = part.match(/(\d{1,2}:\d{2})\s*[-–—a]\s*(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000`;
      };

      schedules.push({
        day,
        is_closed: false,
        opening_time: formatTime(timeMatch[1]),
        closing_time: formatTime(timeMatch[2])
      });
    }
  });

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

      // Parse hours to structured format
      const structuredSchedules = result.horarios_texto 
        ? parseGoogleHours(result.horarios_texto)
        : [];

      return ctx.send({
        success: true,
        data: {
          website: result.website,
          reserva_url: result.reserva_url,
          google_maps_url: result.google_maps_url,
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
