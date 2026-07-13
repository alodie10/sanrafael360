import { DiscoveryService } from '../../../services/discovery-service';
import { parseGoogleHours } from '../../../utils/parse-google-hours';

const discoveryService = new DiscoveryService();

export async function syncGoogleBusiness(name: string, strapi: any) {
  strapi.log.info(`[Discovery] Starting sync for: ${name}`);
  const result = await discoveryService.discover(name);

  if (!result.success) {
    return {
      success: false as const,
      error: result.error || 'No se pudo encontrar el negocio en Google Maps',
    };
  }

  const discoveryData = result.data || {};
  const structuredSchedules = discoveryData.schedules?.length
    ? discoveryData.schedules
    : discoveryData.horarios_texto
      ? parseGoogleHours(discoveryData.horarios_texto)
      : [];

  strapi.log.info(`[Discovery] Returning ${structuredSchedules.length} schedule entries for: ${name}`);

  return {
    success: true as const,
    data: {
      ...result.data,
      schedules: structuredSchedules,
      raw_hours: result.horarios_texto,
    },
  };
}
