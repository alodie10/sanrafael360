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

export interface DiscoveryResult {
  website?: string;
  reserva_url?: string;
  google_maps_url?: string;
  horarios_texto?: string;
  /** Structured schedules ready to store — filled by Places API strategy */
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

// Google Places day index → Spanish day name
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
 * Convert "HHMM" string (e.g. "1930") to "HH:MM:00.000"
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

  private async discoverViaPlacesAPI(businessName: string): Promise<DiscoveryResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('No GOOGLE_MAPS_API_KEY in environment');

    const base = 'https://maps.googleapis.com/maps/api/place';

    // 1. Text Search → place_id
    const query = encodeURIComponent(`${businessName} San Rafael Mendoza Argentina`);
    const searchUrl = `${base}/textsearch/json?query=${query}&key=${apiKey}&language=es`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();

    if (searchData.status !== 'OK' || !searchData.results?.length) {
      throw new Error(`Places Text Search failed: ${searchData.status} — ${searchData.error_message || ''}`);
    }

    const placeId: string = searchData.results[0].place_id;
    console.log(`[DiscoveryService:PlacesAPI] Found place_id: ${placeId}`);

    // 2. Place Details → opening_hours, website
    const detailsUrl = `${base}/details/json?place_id=${placeId}&fields=name,opening_hours,website,url&key=${apiKey}&language=es`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData: any = await detailsRes.json();

    if (detailsData.status !== 'OK') {
      throw new Error(`Places Details failed: ${detailsData.status}`);
    }

    const result = detailsData.result || {};
    const schedules: PlacesSchedule[] = result.opening_hours?.periods
      ? periodsToSchedules(result.opening_hours.periods)
      : [];

    // Build horarios_texto for legacy compatibility (logging/fallback display)
    const horariosTexto = result.opening_hours?.weekday_text?.join('; ') || undefined;

    return {
      success: true,
      schedules,
      horarios_texto: horariosTexto,
      website: result.website || undefined,
      google_maps_url: result.url || undefined,
    };
  }

  // ─── Playwright Fallback ────────────────────────────────────────────────────

  /**
   * Resilient selectors for Google Maps (kept as fallback)
   */
  private selectors = {
    resultTitle: 'h1.DUwDvf',
    hoursExpand: '[aria-label*="Mostrar el horario"], [aria-label*="Ver el horario"]',
  };

  private sanitizeText(text: string): string {
    // NOTE: Do NOT convert Buffer latin1→utf8 — text from Playwright is already
    // valid UTF-8 in modern Node. That conversion corrupts characters like – (en dash).
    return text
      .replace(/Ocultar horarios.*/gi, '')
      .replace(/Plus\s*Code:.*|Cerrado\s*temporalmente/gi, '')
      .replace(/Copiar el horario de atención.*/gi, '')
      .replace(/[\u00a0\u200b\u202f]/g, ' ')  // NBSP / zero-width / narrow NBSP → space
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async discoverViaPlaywright(businessName: string): Promise<DiscoveryResult> {
    let browser: any;
    console.log(`[DiscoveryService:Playwright] Starting browser for: ${businessName}`);

    const { chromium } = await import('playwright');
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    } catch (launchErr: any) {
      return { success: false, error: `Navegador no disponible: ${launchErr.message}` };
    }

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'es-AR',
    });
    const page = await context.newPage();

    try {
      const query = encodeURIComponent(`${businessName} San Rafael Mendoza`);
      await page.goto(`https://www.google.com/maps/search/${query}`, { waitUntil: 'load', timeout: 30000 });

      const cookieBtn = page.locator('button[aria-label*="Aceptar"], button[aria-label*="Agree"]').first();
      if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click().catch(() => {});
      }

      const state = await Promise.race([
        page.waitForSelector('h1.DUwDvf', { timeout: 10000 }).then(() => 'CARD'),
        page.waitForSelector('a.hfpxzc', { timeout: 10000 }).then(() => 'LIST'),
        page.waitForFunction(() => {
          const bodyTxt = (globalThis as any).document?.body?.innerText || '';
          return bodyTxt.includes('No se ha podido encontrar') || bodyTxt.includes('No hay resultados');
        }, { timeout: 10000 }).then(() => 'NOT_FOUND'),
      ]).catch(() => 'TIMEOUT');

      if (state === 'LIST') {
        await page.locator('a.hfpxzc').first().click();
        await page.waitForSelector('h1.DUwDvf', { timeout: 10000 }).catch(() => {});
      } else if (state === 'NOT_FOUND' || state === 'TIMEOUT') {
        const hasTitle = await page.locator('h1').count() > 0;
        if (!hasTitle) throw new Error('Negocio no encontrado en Google Maps');
      }

      const discoveryResult: DiscoveryResult = {
        google_maps_url: page.url(),
        success: true
      };

      // Website
      const websiteLink = page.locator('a[data-item-id="authority"]').first();
      if (await websiteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        discoveryResult.website = await websiteLink.getAttribute('href') || undefined;
      }

      // Hours — try expand button first, then aria-label of day button
      const expandBtn = page.locator(this.selectors.hoursExpand).first();
      if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expandBtn.click({ force: true });
        await page.waitForTimeout(2000);
      }

      // New table class
      const tableRows = page.locator('table.eK4R0e tr');
      const rowCount = await tableRows.count();
      if (rowCount > 0) {
        const lines: string[] = [];
        for (let i = 0; i < rowCount; i++) {
          const text = await tableRows.nth(i).innerText().catch(() => '');
          if (text.trim()) lines.push(text.replace(/\t/g, ' ').trim());
        }
        discoveryResult.horarios_texto = this.sanitizeText(lines.join('; '));
      } else {
        // Try the day button aria-label (has today's hours)
        const dayBtn = page.locator('button[aria-label*="a.m."], button[aria-label*="p.m."]').first();
        if (await dayBtn.count() > 0) {
          const label = await dayBtn.getAttribute('aria-label') || '';
          discoveryResult.horarios_texto = this.sanitizeText(label);
        }
      }

      return discoveryResult;

    } catch (error: any) {
      console.warn(`[DiscoveryService:Playwright] Discovery failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await browser.close().catch(() => {});
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async discover(businessName: string): Promise<DiscoveryResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Diagnostic: log key presence (never log value)
    console.log(`[DiscoveryService] GOOGLE_MAPS_API_KEY present: ${!!process.env.GOOGLE_MAPS_API_KEY} | NEXT_PUBLIC key present: ${!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} | effective key length: ${apiKey?.length ?? 0}`);

    if (apiKey) {
      console.log(`[DiscoveryService] Using Places API for: ${businessName}`);
      try {
        return await this.discoverViaPlacesAPI(businessName);
      } catch (err: any) {
        console.warn(`[DiscoveryService] Places API failed (${err.message}), falling back to Playwright`);
      }
    } else {
      console.warn('[DiscoveryService] No API key found — falling back to Playwright. Add GOOGLE_MAPS_API_KEY to Railway env vars.');
    }

    return this.discoverViaPlaywright(businessName);
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
