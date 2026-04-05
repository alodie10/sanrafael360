import { DiscoveryService } from '../../../../services/discovery-service';

const discoveryService = new DiscoveryService();

export default {
  async afterCreate(event: any) {
    const { result } = event;
    
    // Solo disparamos el descubrimiento si no se ingresaron datos manualmente
    if (!result.website && !result.reserva_url) {
      console.log(`Auto-discovery triggered for new business: ${result.nombre}`);
      
      const discovery = await discoveryService.discover(result.nombre);
      
      if (discovery.success) {
        await strapi.query('api::negocio.negocio').update({
          where: { id: result.id },
          data: {
            website: discovery.website || result.website,
            reserva_url: discovery.reserva_url || result.reserva_url,
            google_maps_url: discovery.google_maps_url,
            horarios_texto: discovery.horarios_texto,
            discovery_pending: false,
            discovery_verified: false // Requiere validación humana
          },
        });
        console.log(`Auto-discovery completed for: ${result.nombre}`);
      } else {
        console.warn(`Auto-discovery failed for ${result.nombre}: ${discovery.error}`);
      }
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;
    
    // Si el usuario activa manualmente el DISCOVERY via el toggle trigger_discovery
    if (params.data.trigger_discovery === true) {
       console.log(`Manual discovery request (Re-scan) for: ${result.nombre}`);
       
       const discovery = await discoveryService.discover(result.nombre);
       
       if (discovery.success) {
          await strapi.query('api::negocio.negocio').update({
            where: { id: result.id },
            data: {
              website: discovery.website || result.website,
              reserva_url: discovery.reserva_url || result.reserva_url,
              google_maps_url: discovery.google_maps_url,
              horarios_texto: discovery.horarios_texto,
              discovery_pending: false,
              trigger_discovery: false // Resetear el botón
            }
          });
          console.log(`Manual discovery successful for: ${result.nombre}`);
       } else {
          // Resetear el botón incluso si falla para permitir re-intento manual
          await strapi.query('api::negocio.negocio').update({
            where: { id: result.id },
            data: { trigger_discovery: false }
          });
          console.warn(`Manual discovery failed for ${result.nombre}: ${discovery.error}`);
       }
    }
  }
};
