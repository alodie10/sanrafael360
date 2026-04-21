
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
  const parts = hoursText.split(',').map(p => p.trim());

  parts.forEach(part => {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) return;

    const dayNameRaw = part.substring(0, colonIndex).toLowerCase().trim();
    const timeInfo = part.substring(colonIndex + 1).trim();
    
    const day = daysMapping[dayNameRaw];
    if (!day) return;

    if (timeInfo.toLowerCase().includes('cerrado')) {
      schedules.push({
        day,
        is_closed: true,
        opening_time: null,
        closing_time: null
      });
      return;
    }

    // Google uses dash (–) or (—) for ranges
    const times = timeInfo.split(/[–—\-]/).map(t => t.trim());
    if (times.length === 2) {
      // Normalize times (e.g. "8:00" -> "08:00:00.000")
      const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000`;
      };

      schedules.push({
        day,
        is_closed: false,
        opening_time: formatTime(times[0]),
        closing_time: formatTime(times[1])
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
