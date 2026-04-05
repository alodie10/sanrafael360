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
            discovery_pending: false,
            // discovery_verified queda en false por defecto para validación humana
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
    
    // Si el usuario marcara manualmente que quiere un re-escaneo (ej: vaciando campos y guardando)
    // o si el nombre cambió significativamente.
    // Para simplificar, solo disparamos si discovery_pending se vuelve true manualmente.
    if (params.data.discovery_pending === true) {
       console.log(`Manual discovery request for: ${result.nombre}`);
       const discovery = await discoveryService.discover(result.nombre);
       
       if (discovery.success) {
          await strapi.query('api::negocio.negocio').update({
            where: { id: result.id },
            data: {
              website: discovery.website || result.website,
              reserva_url: discovery.reserva_url || result.reserva_url,
              google_maps_url: discovery.google_maps_url,
              discovery_pending: false
            }
          });
       }
    }
  }
};
