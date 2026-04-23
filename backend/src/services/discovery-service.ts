/**
 * DiscoveryService — Google Places API + Playwright fallback
 *
 * Primary strategy: Google Places Legacy API (Text Search + Place Details)
 *   - Confiable, rápido, datos estructurados
 *   - Requiere: GOOGLE_MAPS_API_KEY en variables de entorno del backend
 *
 * Fallback: Playwright headless (solo si no hay API key)
 *   - Frágil (depende de la estructura HTML de Google Maps)
 *   - Solo se activa si la API key no está disponible
 */

export interface DiscoveryCandidate {
  place_id: string;
  nombre: string;
  direccion?: string;
  rating?: number;
  user_ratings_total?: number;
  photo_reference?: string;
  location?: { lat: number; lng: number };
  types?: string[];
}

export interface DiscoveryResult {
  candidates: DiscoveryCandidate[];
  success: boolean;
  error?: string;
}

export interface DetailedDiscovery {
  website?: string;
  google_maps_url?: string;
  horarios_texto?: string;
  telefono?: string;
  schedules?: PlacesSchedule[];
  success: boolean;
  error?: string;
}

export interface PlacesSchedule {
  day: string;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
}

/**
 * Google Places day index → Spanish day name
 */
const DAY_INDEX_MAP: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/**
 * Utility to expand shortened URLs (goo.gl/maps or maps.app.goo.gl)
 */
async function expandUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
    return response.url;
  } catch (err) {
    console.error('[DiscoveryService] Error expanding URL:', err);
    return shortUrl;
  }
}

/**
 * Extract Name, Coordinates and CID from a Google Maps URL
 */
function extractFromUrl(url: string): { searchTerm?: string; location?: { lat: number; lng: number }; cid?: string } {
  const result: { searchTerm?: string; location?: { lat: number; lng: number }; cid?: string } = {};

  // 1. Extract CID (Internal Google ID) - usually after !1s0x...:0x...
  const cidMatch = url.match(/!1s0x[a-f0-9]+:(0x[a-f0-9]+)/i);
  if (cidMatch) {
    // Convert hex CID to decimal (Google API sometimes prefers decimal CID)
    try {
      result.cid = BigInt(cidMatch[1]).toString();
    } catch (e) {
      result.cid = cidMatch[1];
    }
  }

  // 2. Extract Business Name (after /place/NAME/)
  const nameMatch = url.match(/\/place\/([^/@]+)/);
  if (nameMatch) {
    result.searchTerm = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
  }

  // 3. Extract Coordinates (after /@LAT,LNG/)
  const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordsMatch) {
    result.location = {
      lat: parseFloat(coordsMatch[1]),
      lng: parseFloat(coordsMatch[2])
    };
  }

  return result;
}

/**
 * Convert "HHMM" string (e.g. "1930") to "HH:MM:00"
 */
function formatPlacesTime(hhmm: string): string {
  const h = hhmm.substring(0, 2).padStart(2, '0');
  const m = hhmm.substring(2, 4).padStart(2, '0');
  return `${h}:${m}:00`;
}

/**
 * Convert Google Places `opening_hours.periods` into our ScheduleEntry array.
 * Handles split shifts (multiple open periods per day) by taking the first
 * open and last close of each day.
 */
function periodsToSchedules(periods: any[]): PlacesSchedule[] {
  // Build a lookup: for each period, key by open day + open time
  const byDay: Record<number, Array<{ openTime: string; closeTime: string | null }>> = {};

  for (const period of periods) {
    const openDay: number = period.open?.day;
    if (openDay === undefined) continue;

    if (!byDay[openDay]) byDay[openDay] = [];
    byDay[openDay].push({
      openTime: period.open?.time ?? '0000',
      closeTime: period.close?.time ?? null,
    });
  }

  // Sort each day's periods by openTime
  for (const d of Object.keys(byDay).map(Number)) {
    byDay[d].sort((a, b) => a.openTime.localeCompare(b.openTime));
  }

  const schedules: PlacesSchedule[] = [];

  for (let d = 0; d <= 6; d++) {
    const dayName = DAY_INDEX_MAP[d];
    if (!dayName) continue;

    if (!byDay[d] || byDay[d].length === 0) {
      // No period for this day → closed
      schedules.push({ day: dayName, is_closed: true, opening_time: null, closing_time: null });
    } else {
      // Return all periods for the day
      for (const p of byDay[d]) {
        schedules.push({
          day: dayName,
          is_closed: false,
          opening_time: p.openTime ? formatPlacesTime(p.openTime) : null,
          closing_time: p.closeTime ? formatPlacesTime(p.closeTime) : null,
        });
      }
    }
  }

  return schedules;
}

export class DiscoveryService {

  // ─── Places API Strategy ────────────────────────────────────────────────────

  private async fetchDetails(placeId: string, apiKey: string): Promise<any> {
    const fields = 'name,opening_hours,website,url,formatted_phone_number,formatted_address,rating,user_ratings_total,photos,geometry';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=es`;
    const detailsRes = await fetch(detailsUrl);
    return await detailsRes.json();
  }

  async discover(input: string): Promise<any> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { success: false, error: 'Google Maps API Key not configured' };

    try {
      let placeId: string | undefined;
      let businessName = input;
      let biasLocation: { lat: number; lng: number } | undefined;
      let extractedCid: string | undefined;

      // 1. Detect if input is a Google Maps URL
      if (input.includes('google.com/maps') || input.includes('maps.app.goo.gl')) {
        const fullUrl = input.includes('goo.gl') ? await expandUrl(input) : input;
        const extracted = extractFromUrl(fullUrl);
        if (extracted.searchTerm) businessName = extracted.searchTerm;
        if (extracted.location) biasLocation = extracted.location;
        if (extracted.cid) extractedCid = extracted.cid;
      }

      // 2. Direct Call by CID (Pinpoint Accuracy)
      if (extractedCid) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?cid=${extractedCid}&key=${apiKey}&language=es&fields=name,formatted_address,formatted_phone_number,website,url,rating,user_ratings_total,photos,geometry,opening_hours,place_id`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData: any = await detailsRes.json();

        if (detailsData.status === 'OK' && detailsData.result) {
          const result = detailsData.result;
          const schedules = result.opening_hours?.periods?.map((p: any) => ({
            day: p.open.day,
            opening_time: convertTime(p.open.time),
            closing_time: convertTime(p.close.time)
          })) || [];

          return {
            success: true,
            data: {
              place_id: result.place_id,
              nombre: result.name,
              website: result.website,
              telefono: result.formatted_phone_number,
              direccion: result.formatted_address,
              google_maps_url: result.url,
              rating: result.rating,
              user_ratings_total: result.user_ratings_total,
              photo_reference: result.photos?.[0]?.photo_reference,
              location: result.geometry?.location,
              schedules
            }
          };
        }
      }

      // 3. Fallback to Text Search (if no CID or CID failed)
      if (!placeId) {
        const query = encodeURIComponent(businessName);
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=es`;
        
        if (biasLocation) {
          searchUrl += `&location=${biasLocation.lat},${biasLocation.lng}&radius=1000`;
        }

        const searchRes = await fetch(searchUrl);
        const searchData: any = await searchRes.json();

        if (searchData.status === 'OK' && searchData.results?.length > 0) {
          placeId = searchData.results[0].place_id;
        }
      }

      if (!placeId) throw new Error('No se pudo identificar el negocio en Google Maps.');

      // 3. Fetch full details
      const detailsData = await this.fetchDetails(placeId, apiKey);
      if (detailsData.status !== 'OK') throw new Error(`Google API Error: ${detailsData.status}`);

      const result = detailsData.result || {};
      const schedules = result.opening_hours?.periods
        ? periodsToSchedules(result.opening_hours.periods)
        : [];

      return {
        success: true,
        data: {
          place_id: placeId,
          nombre: result.name,
          website: result.website,
          telefono: result.formatted_phone_number,
          direccion: result.formatted_address,
          google_maps_url: result.url,
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          photo_reference: result.photos?.[0]?.photo_reference,
          location: result.geometry?.location,
          schedules
        }
      };
    } catch (err: any) {
      console.error(`[DiscoveryService] Error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async discoverBatch(businesses: { id: string, name: string }[]): Promise<Map<string, DiscoveryResult>> {
    const results = new Map<string, DiscoveryResult>();
    let successCount = 0;

    for (const biz of businesses) {
      console.log(`Processing discovery for: ${biz.name}...`);
      const result = await this.discover(biz.name);
      results.set(biz.id, result);
      if (result.success) successCount++;
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }

    const rate = (successCount / businesses.length) * 100;
    if (rate < 70) {
      console.error(`⚠️ Discovery success rate: ${rate.toFixed(2)}% (threshold 70%)`);
    } else {
      console.log(`Discovery: ${successCount}/${businesses.length} (${rate.toFixed(2)}%)`);
    }

    return results;
  }
}
