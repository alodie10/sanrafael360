import { DiscoveryService } from '../../../../services/discovery-service';

const discoveryService = new DiscoveryService();

async function syncTripAdvisor(url: string): Promise<{ success: boolean; rating?: number; reviewCount?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();

    const jsonLdRegex = /"aggregateRating"\s*:\s*\{[^}]+\}/i;
    const match = html.match(jsonLdRegex);
    
    let rating = 0;
    let reviewCount = 0;

    if (match) {
      const block = match[0];
      const ratingMatch = block.match(/"ratingValue"\s*:\s*"([^"]+)"/i) || block.match(/"ratingValue"\s*:\s*(\d+\.?\d*)/i);
      const countMatch = block.match(/"reviewCount"\s*:\s*"([^"]+)"/i) || block.match(/"reviewCount"\s*:\s*(\d+)/i);
      
      if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
      if (countMatch) reviewCount = parseInt(countMatch[1]);
    } else {
      const bubbleMatch = html.match(/bubble_(\d+)/i);
      if (bubbleMatch) {
        rating = parseInt(bubbleMatch[1]) / 10;
      }
      
      const scoreMatch = html.match(/(\d[\.,]\d)\s+de\s+5/i) || html.match(/(\d)\s+de\s+5/i);
      if (scoreMatch && !rating) {
        rating = parseFloat(scoreMatch[1].replace(',', '.'));
      }
      
      const reviewsCountMatch = html.match(/(\d+[\.\s]?\d*)\s+opiniones/i) || html.match(/(\d+[\.\s]?\d*)\s+opinión/i) || html.match(/(\d+[\.\s]?\d*)\s+reviews/i);
      if (reviewsCountMatch) {
        reviewCount = parseInt(reviewsCountMatch[1].replace(/[\.\s]/g, ''));
      }
    }

    return { success: true, rating, reviewCount };
  } catch (err: any) {
    console.error(`[TripAdvisor Scraper] Error scraping ${url}:`, err.message);
    return { success: false, error: err.message };
  }
}

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
              await strapi.documents('api::negocio.negocio').update({
                documentId: result.documentId,
                data: {
                  website: discovery.data?.website || result.website,
                  reserva_url: discovery.data?.reserva_url || result.reserva_url,
                  google_maps_url: discovery.data?.google_maps_url,
                  google_place_id: discovery.data?.place_id,
                  google_rating: discovery.data?.rating,
                  google_review_count: discovery.data?.user_ratings_total,
                  horarios_texto: discovery.data?.horarios_texto,
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

    // TripAdvisor auto-sync on create
    if (result.tripadvisor_url) {
      syncTripAdvisor(result.tripadvisor_url).then(async (data) => {
        if (data.success && data.rating) {
          await strapi.documents('api::negocio.negocio').update({
            documentId: result.documentId,
            data: {
              tripadvisor_rating: data.rating,
              tripadvisor_review_count: data.reviewCount
            }
          });
          console.log(`TripAdvisor auto-sync completed for: ${result.nombre}`);
        }
      }).catch(err => console.error(`TripAdvisor auto-sync error for ${result.nombre}:`, err));
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
                  await strapi.documents('api::negocio.negocio').update({
                    documentId: result.documentId,
                    data: {
                      website: discovery.data?.website || result.website,
                      reserva_url: discovery.data?.reserva_url || result.reserva_url,
                      google_maps_url: discovery.data?.google_maps_url,
                      google_place_id: discovery.data?.place_id,
                      google_rating: discovery.data?.rating,
                      google_review_count: discovery.data?.user_ratings_total,
                      horarios_texto: discovery.data?.horarios_texto,
                      discovery_pending: false,
                      trigger_discovery: false
                    }
                  });
                 console.log(`Manual discovery successful for: ${result.nombre}`);
              } else {
                 await strapi.documents('api::negocio.negocio').update({
                   documentId: result.documentId,
                   data: { trigger_discovery: false }
                 }).catch(() => {});
                 console.warn(`[Discovery] Manual discovery bypassed: ${discovery.error}`);
              }
            })
            .catch(err => {
              console.error(`[Discovery] Unhandled async error:`, err.message);
              strapi.documents('api::negocio.negocio').update({
                documentId: result.documentId,
                data: { trigger_discovery: false }
              }).catch(() => {});
            });
        } catch (err) {
          console.error(`Crash prevented in afterUpdate for ${result.nombre}:`, err);
        }
     }

     // TripAdvisor manual sync on update (if URL changed/provided)
     if (params.data && params.data.tripadvisor_url !== undefined && params.data.tripadvisor_url !== null) {
       const newUrl = params.data.tripadvisor_url;
       if (newUrl) {
         console.log(`TripAdvisor sync requested for: ${result.nombre} (${newUrl})`);
         syncTripAdvisor(newUrl).then(async (data) => {
           if (data.success && data.rating) {
             await strapi.documents('api::negocio.negocio').update({
               documentId: result.documentId,
               data: {
                 tripadvisor_rating: data.rating,
                 tripadvisor_review_count: data.reviewCount
               }
             });
             console.log(`TripAdvisor manual sync completed for: ${result.nombre}`);
           }
         }).catch(err => console.error(`TripAdvisor manual sync error for ${result.nombre}:`, err));
       }
     }
  }
};
