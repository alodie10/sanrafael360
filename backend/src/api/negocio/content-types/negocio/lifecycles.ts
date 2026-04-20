import { DiscoveryService } from '../../../../services/discovery-service';

const discoveryService = new DiscoveryService();

export default {
  async afterCreate(event: any) {
    const { result } = event;
    
    // Solo disparamos el descubrimiento si no se ingresaron datos manualmente
    if (!result.website && !result.reserva_url) {
      console.log(`Auto-discovery triggered for new business: ${result.nombre}`);
      
      try {
        // Fire & Forget: Se ejecuta asíncronamente sin bloquear la respuesta del servidor
        discoveryService.discover(result.nombre)
          .then(async (discovery) => {
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
          })
          .catch(err => console.error(`Unhandled error in auto-discovery for ${result.nombre}:`, err));
      } catch (err) {
        console.error(`Crash prevented in afterCreate for ${result.nombre}:`, err);
      }
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;
    
     // Si el usuario activa manualmente el DISCOVERY via el toggle trigger_discovery
     if (params.data.trigger_discovery === true) {
        console.log(`Manual discovery request (Re-scan) for: ${result.nombre}`);
        
        try {
          // Fire & Forget con manejo de errores ultra-seguro
          discoveryService.discover(result.nombre)
            .then(async (discovery) => {
              if (discovery.success) {
                 await strapi.query('api::negocio.negocio').update({
                   where: { id: result.id },
                   data: {
                     website: discovery.website || result.website,
                     reserva_url: discovery.reserva_url || result.reserva_url,
                     google_maps_url: discovery.google_maps_url,
                     horarios_texto: discovery.horarios_texto,
                     discovery_pending: false,
                     trigger_discovery: false
                   }
                 });
                 console.log(`Manual discovery successful for: ${result.nombre}`);
              } else {
                 await strapi.query('api::negocio.negocio').update({
                   where: { id: result.id },
                   data: { trigger_discovery: false }
                 }).catch(() => {});
                 console.warn(`[Discovery] Manual discovery bypassed: ${discovery.error}`);
              }
            })
            .catch(err => {
              console.error(`[Discovery] Unhandled async error:`, err.message);
              strapi.query('api::negocio.negocio').update({
                where: { id: result.id },
                data: { trigger_discovery: false }
              }).catch(() => {});
            });
        } catch (err: any) {
          console.error(`[Discovery] Critical sync error prevented:`, err.message);
        }
     }

  }
};
