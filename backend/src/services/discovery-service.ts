import { chromium } from 'playwright';

export interface DiscoveryResult {
  website?: string;
  reserva_url?: string;
  google_maps_url?: string;
  horarios_texto?: string;
  success: boolean;
  error?: string;
}

export class DiscoveryService {
  /**
   * Resilient selectors for Google Maps
   * Focus on role, aria-label and data-attributes for stability
   */
  private selectors = {
    searchBox: 'input#searchboxinput',
    searchButton: 'button#searchbox-searchbutton',
    website: 'a[data-item-id="authority"]',
    booking: 'a[data-item-id="action:3"], a[aria-label*="Cita"], a[aria-label*="Reserva"]',
    resultTitle: 'h1.DUwDvf',
    hours: 'div[aria-label*="Cerrado"], div[aria-label*="Abierto"], .t39Tv',
    notFoundContainer: 'div.Q2vSnd, div.id6v7, div.O0ZZCc', // Various containers for "No results" or "Partial match"
    addPlaceButton: 'button.kyuRq, a[href*="addplace"]', // "Agregar un lugar faltante"
  };

  /**
   * Cleans and normalizes decoded text to fix typical UTF-8 corruption
   */
  private sanitizeText(text: string): string {
    let clean = text;
    try {
      // Intentar decodificar corrupción común de UTF-8 a Latin1
      clean = Buffer.from(clean, 'latin1').toString('utf8');
    } catch(e) {}
    
    return clean
      .replace(/SÃ¡bado|SÃ;bado|Sã¡bado/gi, 'Sábado')
      .replace(/MiÃ©rcoles|Miã©rcoles/gi, 'Miércoles')
      .replace(/Ocultar horarios.*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async discover(businessName: string): Promise<DiscoveryResult> {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (launchErr: any) {
      console.warn(`[DiscoveryService] Browser launch failed: ${launchErr.message}`);
      return {
        success: false,
        error: 'Navegador no disponible en el servidor (Playwright missing)'
      };
    }

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'es-AR',
    });
    const page = await context.newPage();

    try {
      // 1. Ir a Google Maps
      const query = encodeURIComponent(businessName + ' San Rafael Mendoza');
      await page.goto(`https://www.google.com/maps/search/${query}`, { waitUntil: 'domcontentloaded' });
      
      // Competencia de detección: ¿Ficha directa, Lista de resultados, o No encontrado?
      const result = await Promise.race([
        page.waitForSelector(this.selectors.resultTitle, { timeout: 10000 }).then(() => 'CARD'),
        page.waitForSelector('a.hfpxzc', { timeout: 10000 }).then(() => 'LIST'),
        page.waitForSelector(this.selectors.notFoundContainer, { timeout: 10000 }).then(() => 'NOT_FOUND'),
        page.waitForSelector(this.selectors.addPlaceButton, { timeout: 10000 }).then(() => 'NOT_FOUND'),
        page.waitForFunction(() => {
          const text = document.body.innerText;
          return text.includes('No se ha podido encontrar') || 
                 text.includes('Google Maps no puede encontrar') ||
                 text.includes('Coincidencia parcial');
        }, { timeout: 10000 }).then(() => 'NOT_FOUND_TEXT')
      ]).catch(() => 'TIMEOUT');

      if (result === 'LIST') {
        const firstResult = page.locator('a.hfpxzc').first();
        await firstResult.click();
        // Esperamos un momento a ver si carga la ficha, pero si no, seguimos (podría ser una lista de uno)
        await page.waitForSelector(this.selectors.resultTitle, { timeout: 5000 }).catch(() => {});
      } else if (result === 'NOT_FOUND' || result === 'NOT_FOUND_TEXT' || result === 'TIMEOUT') {
        throw new Error('Negocio no encontrado en Google Maps');
      }

      const discoveryResult: DiscoveryResult = {
        google_maps_url: page.url(),
        success: true
      };

      // 2. Extraer Website (Item ID stable)
      const websiteLink = page.locator(this.selectors.website);
      if (await websiteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        discoveryResult.website = await websiteLink.getAttribute('href') || undefined;
      }

      // 3. Extraer Link de Reservas (Item ID stable)
      const bookingLink = page.locator(this.selectors.booking).first();
      if (await bookingLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        discoveryResult.reserva_url = await bookingLink.getAttribute('href') || undefined;
      }

      // 4. Extraer Horarios (Aria-label stable)
      const hoursEl = page.locator(this.selectors.hours).first();
      if (await hoursEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        const rawHours = await hoursEl.getAttribute('aria-label') || await hoursEl.innerText() || '';
        if (rawHours) {
           discoveryResult.horarios_texto = this.sanitizeText(rawHours);
        }
      }

      return discoveryResult;

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Bulk discovery with success rate threshold alerting
   */
  async discoverBatch(businesses: { id: string, name: string }[]): Promise<Map<string, DiscoveryResult>> {
    const results = new Map<string, DiscoveryResult>();
    let successCount = 0;

    for (const biz of businesses) {
      console.log(`Processing discovery for: ${biz.name}...`);
      const result = await this.discover(biz.name);
      results.set(biz.id, result);
      
      if (result.success) successCount++;
      
      // Delay throttling to avoid blocks (3s to 7s)
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
    }

    const rate = (successCount / businesses.length) * 100;
    if (rate < 70) {
      console.error(`⚠️ CRITICAL: Discovery success rate dropped to ${rate.toFixed(2)}%. Threshold is 70%. Check for CSS/HTML changes in target.`);
    } else {
      console.log(`Discovery successful for ${successCount}/${businesses.length} businesses (${rate.toFixed(2)}%).`);
    }

    return results;
  }
}
