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
    hoursButton: 'button[data-item-id="oh"], [jsaction*="pane.wfopn.hours"], button[aria-label*="Horarios"], button[aria-label*="Hours"]',
    hoursTable: 'table.e07nqc, [aria-label*="Horas"], [aria-label*="Hours"]',
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
      .replace(/Plus\s*Code:.*|Cerrado\s*temporalmente/gi, '') // Ignorar Plus Codes y avisos genéricos
      .replace(/\s+/g, ' ')
      .trim();
  }

  async discover(businessName: string): Promise<DiscoveryResult> {
    let browser;
    console.log(`[DiscoveryService] Starting browser for: ${businessName}`);
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    } catch (launchErr: any) {
      console.warn(`[DiscoveryService] Browser launch failed: ${launchErr.message}`);
      return {
        success: false,
        error: 'Navegador no disponible en el servidor (Playwright missing/crashed)'
      };
    }

    console.log(`[DiscoveryService] Browser launched. Opening Google Maps...`);
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'es-AR',
    });
    const page = await context.newPage();

    try {
      // 1. Ir a Google Maps con búsqueda ultra-específica
      const query = encodeURIComponent(`${businessName} San Rafael Mendoza`);
      let targetUrl = `https://www.google.com/maps/search/${query}`;
      
      console.log(`[DiscoveryService] Navigating to: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
      
      // Manejar muro de Cookies (común en es-AR)
      const cookieBtn = page.locator('button[aria-label*="Aceptar"], button[aria-label*="Agree"], button[aria-label*="Todo"]').first();
      if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click().catch(() => {});
      }

      // 2. Detección de Estado (Ficha, Lista o Not Found)
      const state = await Promise.race([
        page.waitForSelector('h1.DUwDvf, [role="main"] h1', { timeout: 10000 }).then(() => 'CARD'),
        page.waitForSelector('a.hfpxzc, [role="article"] a', { timeout: 10000 }).then(() => 'LIST'),
        page.waitForFunction(() => {
          const txt = document.body.innerText;
          return txt.includes('No se ha podido encontrar') || txt.includes('no puede encontrar') || txt.includes('No hay resultados');
        }, { timeout: 10000 }).then(() => 'NOT_FOUND'),
      ]).catch(() => 'TIMEOUT');

      if (state === 'LIST') {
        console.log(`[DiscoveryService] List view detected. Clicking first result...`);
        const firstResult = page.locator('a.hfpxzc, [role="article"] a').first();
        await firstResult.click();
        await page.waitForSelector('h1.DUwDvf, [role="main"] h1', { timeout: 10000 }).catch(() => {});
      } else if (state === 'NOT_FOUND' || state === 'TIMEOUT') {
         // Verificación final: ¿Quizás la ficha cargó sin los selectores esperados?
         const hasTitle = await page.locator('h1').count() > 0;
         if (!hasTitle) throw new Error('Negocio no encontrado en Google Maps');
      }

      const discoveryResult: DiscoveryResult = {
        google_maps_url: page.url(),
        success: true
      };

      // 3. Extracción de Datos con selectores robustos
      const websiteLink = page.locator('a[data-item-id="authority"]').first();
      if (await websiteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        discoveryResult.website = await websiteLink.getAttribute('href') || undefined;
      }

      // 4. Extracción de Horarios (Detección de Vista Limitada vs Full)
      const isLimited = await page.evaluate(() => document.body.innerText.toLowerCase().includes('vista limitada'));
      const hoursBtn = page.locator('button[data-item-id="oh"], [jsaction*="pane.wfopn.hours"], button[aria-label*="Horarios"]').first();

      if (await hoursBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        try {
          await hoursBtn.click({ force: true });
          const rows = page.locator('table.e07nqc tr[aria-label]');
          if (await rows.count() > 0) {
            const fullHours: string[] = [];
            const count = await rows.count();
            for (let i = 0; i < count; i++) {
              const label = await rows.nth(i).getAttribute('aria-label');
              if (label) fullHours.push(label);
            }
            discoveryResult.horarios_texto = this.sanitizeText(fullHours.join('; '));
          } else {
            discoveryResult.horarios_texto = this.sanitizeText(await hoursBtn.getAttribute('aria-label') || '');
          }
        } catch (e) {
          discoveryResult.horarios_texto = this.sanitizeText(await hoursBtn.getAttribute('aria-label') || '');
        }
      } else if (isLimited) {
        // En vista limitada los horarios suelen estar en el bloque principal de texto
        const statusText = await page.locator('div[aria-label*="Cierra"], div[aria-label*="Abre"]').first().getAttribute('aria-label').catch(() => null);
        if (statusText) {
          discoveryResult.horarios_texto = this.sanitizeText(statusText);
        }
      }

      return discoveryResult;

    } catch (error: any) {
      console.warn(`[DiscoveryService] Discovery failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await browser.close().catch(() => {});
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
