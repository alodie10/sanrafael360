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
  };

  async discover(businessName: string): Promise<DiscoveryResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'es-AR',
    });
    const page = await context.newPage();

    try {
      // 1. Ir a Google Maps
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(businessName + ' San Rafael Mendoza')}`);
      
      // Esperar a que los resultados carguen o que se abra la ficha directamente
      // Si se abre la ficha, el h1 del título aparecerá.
      try {
        await page.waitForSelector(this.selectors.resultTitle, { timeout: 8000 });
      } catch (e) {
          // Si no cargó h1, quizás hay una lista de resultados. Intentamos clicar el primero.
          const firstResult = page.locator('a.hfpxzc').first();
          if (await firstResult.isVisible()) {
              await firstResult.click();
              await page.waitForSelector(this.selectors.resultTitle);
          } else {
              throw new Error('Negocio no encontrado en Google Maps');
          }
      }

      const result: DiscoveryResult = {
        google_maps_url: page.url(),
        success: true
      };

      // 2. Extraer Website
      // Usamos el data-item-id de Maps que es muy estable para el link de sitio web
      const websiteLink = page.locator(this.selectors.website);
      if (await websiteLink.isVisible()) {
        result.website = await websiteLink.getAttribute('href') || undefined;
      }

      // 3. Extraer Link de Reservas / Turnos
      // El data-item-id "action:3" suele ser para citas/reservas en la mayoría de fichas
      const bookingLink = page.locator(this.selectors.booking).first();
      if (await bookingLink.isVisible()) {
        result.reserva_url = await bookingLink.getAttribute('href') || undefined;
      }

      // 4. Extraer Horarios
      const hoursEl = page.locator(this.selectors.hours).first();
      if (await hoursEl.isVisible()) {
        result.horarios_texto = await hoursEl.getAttribute('aria-label') || await hoursEl.innerText() || undefined;
        // Limpiar el texto si contiene "Ocultar horarios de la semana" u otros ruidos
        if (result.horarios_texto) {
           result.horarios_texto = result.horarios_texto.replace(/Ocultar horarios.*/gi, '').trim();
        }
      }

      return result;

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
