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
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ]
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
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: 'es-AR',
      timezoneId: 'America/Argentina/Buenos_Aires',
    });
    const page = await context.newPage();

    try {
      // 1. Ir a Google Maps con búsqueda inteligente
      const query = encodeURIComponent(businessName + ' San Rafael');
      let targetUrl = `https://www.google.com/maps/search/${query}`;
      
      console.log(`[DiscoveryService] Navigating to: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
      
      // Manejar muro de Cookies si aparece (común en es-AR)
      const cookieBtn = page.locator('button[aria-label*="Aceptar"], button[aria-label*="Agree"], button[aria-label*="Todo"]').first();
      if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`[DiscoveryService] Cookie consent detected. Clicking accept...`);
        await cookieBtn.click().catch(() => {});
      }

      // Función para detectar el estado actual con mayor tolerancia
      const detectState = async () => {
        return await Promise.race([
          page.waitForSelector('h1.DUwDvf, [role="main"] h1', { timeout: 10000 }).then(() => 'CARD'),
          page.waitForSelector('a.hfpxzc, [role="article"] a', { timeout: 10000 }).then(() => 'LIST'),
          page.waitForFunction(() => {
            const txt = document.body.innerText;
            return txt.includes('No se ha podido encontrar') || txt.includes('no puede encontrar') || txt.includes('No hay resultados');
          }, { timeout: 10000 }).then(() => 'NOT_FOUND'),
        ]).catch(() => 'TIMEOUT');
      };

      let state = await detectState();

      if (state === 'LIST') {
        console.log(`[DiscoveryService] List view detected. Attempting to enter first result...`);
        // Intentar múltiples selectores de lista (Estándar y Vista Limitada)
        const selectors = ['a.hfpxzc', '[role="article"] a', 'div[aria-label*="' + businessName + '"]', 'h3'];
        let clicked = false;
        
        for (const sel of selectors) {
          const loc = page.locator(sel).first();
          if (await loc.isVisible().catch(() => false)) {
            console.log(`[DiscoveryService] Clicking result with selector: ${sel}`);
            await loc.click({ force: true }).catch(() => {});
            clicked = true;
            break;
          }
        }

        if (!clicked) {
          console.log(`[DiscoveryService] No standard selector worked. Trying text-based click...`);
          await page.getByText(businessName, { exact: false }).first().click({ force: true }).catch(() => {});
        }

        await page.waitForSelector('h1.DUwDvf, [role="main"] h1', { timeout: 10000 }).catch(() => {});
      } else if (state === 'TIMEOUT') {
         // Verificación final si dio timeout: ¿Quizás ya estamos en la ficha?
         const hasTitle = await page.locator('h1.DUwDvf').isVisible().catch(() => false);
         if (!hasTitle) {
            throw new Error(`Timeout esperando la ficha del negocio (${state})`);
         }
      } else if (state === 'NOT_FOUND') {
         throw new Error(`Negocio no encontrado en Google Maps para '${businessName}'`);
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

      // 4. Extraer Horarios (Expanded Weekly)
      const hoursBtn = page.locator(this.selectors.hoursButton).first();
      if (await hoursBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        try {
          await hoursBtn.click({ force: true });
          const table = page.locator(this.selectors.hoursTable).first();
          await table.waitFor({ state: 'visible', timeout: 5000 });
          
          const rows = page.locator(`${this.selectors.hoursTable} tr[aria-label]`);
          const count = await rows.count();
          
          if (count > 0) {
            let fullHours: string[] = [];
            for (let i = 0; i < count; i++) {
              const label = await rows.nth(i).getAttribute('aria-label');
              if (label) fullHours.push(label);
            }
            discoveryResult.horarios_texto = this.sanitizeText(fullHours.join('; '));
          } else {
            const text = await table.innerText();
            discoveryResult.horarios_texto = this.sanitizeText(text);
          }
        } catch (e) {
          console.warn(`[DiscoveryService] Failed to expand hours: ${e}`);
          const fallback = await hoursBtn.getAttribute('aria-label') || await hoursBtn.innerText();
          discoveryResult.horarios_texto = this.sanitizeText(fallback || '');
        }
      } else {
        // DEBUG: ¿Por qué no vemos el botón?
        console.warn(`[DiscoveryService] Hours button NOT VISIBLE.`);
        const title = await page.title();
        const url = page.url();
        const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.ariaLabel).filter(l => l));
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
        console.log(`[DiscoveryService] Debug - URL: ${url}`);
        console.log(`[DiscoveryService] Debug - Title: ${title}`);
        console.log(`[DiscoveryService] Debug - All Buttons (#${buttons.length}):`, buttons);
        console.log(`[DiscoveryService] Debug - Body Snippet:`, bodyText.replace(/\n/g, ' '));
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
