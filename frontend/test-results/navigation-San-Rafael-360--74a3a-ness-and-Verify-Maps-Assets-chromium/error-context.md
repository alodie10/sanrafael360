# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> San Rafael 360 - Critical Flow Validation >> Navigate Home to Random Business and Verify Maps/Assets
- Location: tests/navigation.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="google-map"], [data-testid="location-not-found"], [data-testid="google-map-error"]').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="google-map"], [data-testid="location-not-found"], [data-testid="google-map-error"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "San Rafael 360 San Rafael 360" [ref=e5] [cursor=pointer]:
          - /url: /
          - img "San Rafael 360" [ref=e7]
          - generic [ref=e8]: San Rafael 360
        - generic [ref=e9]:
          - link "Alojamientos" [ref=e10] [cursor=pointer]:
            - /url: /?cat=alojamientos
          - link "Gastronomía" [ref=e11] [cursor=pointer]:
            - /url: /?cat=gastronomia
          - link "Actividades" [ref=e12] [cursor=pointer]:
            - /url: /?cat=actividades
          - button [ref=e13] [cursor=pointer]:
            - img [ref=e14]
          - link "Entrar" [ref=e18] [cursor=pointer]:
            - /url: /login
          - link "Vende aquí" [ref=e19] [cursor=pointer]:
            - /url: /contacto
            - img [ref=e20]
            - text: Vende aquí
    - main [ref=e21]:
      - navigation [ref=e22]:
        - generic [ref=e23]:
          - link "San Rafael 360 San Rafael 360" [ref=e24] [cursor=pointer]:
            - /url: /
            - img "San Rafael 360" [ref=e26]
            - generic [ref=e27]: San Rafael 360
          - generic [ref=e28]:
            - link "Alojamientos" [ref=e29] [cursor=pointer]:
              - /url: /?cat=alojamientos
            - link "Gastronomía" [ref=e30] [cursor=pointer]:
              - /url: /?cat=gastronomia
            - link "Actividades" [ref=e31] [cursor=pointer]:
              - /url: /?cat=actividades
            - button [ref=e32] [cursor=pointer]:
              - img [ref=e33]
            - link "Entrar" [ref=e37] [cursor=pointer]:
              - /url: /login
            - link "Vende aquí" [ref=e38] [cursor=pointer]:
              - /url: /contacto
              - img [ref=e39]
              - text: Vende aquí
      - generic [ref=e40]:
        - img "PARRILLA DE LA FINCA" [ref=e41]
        - link "Volver" [ref=e44] [cursor=pointer]:
          - /url: /
          - img [ref=e45]
          - generic [ref=e47]: Volver
        - generic [ref=e49]:
          - img "PARRILLA DE LA FINCA" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - img [ref=e54]
              - img [ref=e56]
              - img [ref=e58]
              - img [ref=e60]
              - img [ref=e62]
              - generic [ref=e64]: (4.8 / 5.0)
            - heading "PARRILLA DE LA FINCA" [level=1] [ref=e65]
            - generic [ref=e66]:
              - generic [ref=e67]:
                - img [ref=e68]
                - generic [ref=e71]: Domicilio Av. H. Yrigoyen 5501 – Las Paredes
              - generic [ref=e72]: Gastronomía
      - generic [ref=e74]:
        - generic [ref=e76]:
          - heading "Descripción" [level=2] [ref=e77]: Descripción
          - generic [ref=e79]: PARRILLA DE LA FINCA en San Rafael.
        - generic [ref=e81]:
          - generic [ref=e82]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e83]
            - paragraph [ref=e84]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e85] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e86]
          - generic [ref=e87]:
            - link "Teléfono 2604500166" [ref=e88] [cursor=pointer]:
              - /url: tel:2604500166
              - generic [ref=e89]:
                - img [ref=e91]
                - generic [ref=e93]:
                  - paragraph [ref=e94]: Teléfono
                  - paragraph [ref=e95]: "2604500166"
            - link "WhatsApp Chatear ahora" [ref=e96] [cursor=pointer]:
              - /url: https://wa.me/2604500166
              - generic [ref=e97]:
                - img [ref=e99]
                - generic [ref=e101]:
                  - paragraph [ref=e102]: WhatsApp
                  - paragraph [ref=e103]: Chatear ahora
          - generic [ref=e105]:
            - generic [ref=e106]:
              - heading "Ubicación" [level=4] [ref=e107]
              - link "Ver en Maps" [ref=e108] [cursor=pointer]:
                - /url: https://www.google.com/maps/search/?api=1&query=-34.5917501,-68.4027131
                - text: Ver en Maps
                - img [ref=e109]
            - paragraph [ref=e115]: Falta la API Key de Google Maps
  - button "Open Next.js Dev Tools" [ref=e121] [cursor=pointer]:
    - img [ref=e122]
  - alert [ref=e125]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('San Rafael 360 - Critical Flow Validation', () => {
  4   | 
  5   |   test.beforeEach(async ({ page, context }) => {
  6   |     // 4G Network Emulation: Simulate high latency (100ms+) and data throttling
  7   |     await context.setOffline(false);
  8   |     await page.route('**/*', async (route) => {
  9   |       // Simulate network delay to expose race conditions
  10  |       await new Promise(f => setTimeout(f, 100)); 
  11  |       await route.continue();
  12  |     });
  13  |   });
  14  | 
  15  |   test('Navigate Home to Random Business and Verify Maps/Assets', async ({ page }) => {
  16  |     // 1. Visit Home
  17  |     await page.goto('/', { waitUntil: 'networkidle' });
  18  |     await page.waitForLoadState('load');
  19  | 
  20  |     // Validate Hero Title — usa el h1 principal (strict: primer heading visible en la sección hero)
  21  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  22  | 
  23  | 
  24  |     // 2. Select a Random Business Card
  25  |     const cards = page.locator('a[href^="/negocios/"]');
  26  |     await cards.first().waitFor({ state: 'visible' });
  27  |     const count = await cards.count();
  28  |     const randomIndex = Math.floor(Math.random() * count);
  29  |     const randomCard = cards.nth(randomIndex);
  30  |     
  31  |     const businessName = await randomCard.innerText();
  32  |     console.log(`Diving into: ${businessName}`);
  33  | 
  34  |     // 3. Click and Navigate
  35  |     await randomCard.click();
  36  |     
  37  |     // 4. Wait for the business name to be visible (client-side rendering)
  38  |     await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });
  39  | 
  40  |     // Verify status 200 by checking the page content (Next.js 404 would show error state)
  41  |     await expect(page.locator('h1')).toBeVisible();
  42  | 
  43  |     // 4. Google Maps Validation
  44  |     // Acepta 3 estados válidos:
  45  |     //   - [google-map]:         Mapa cargado con API Key activa
  46  |     //   - [location-not-found]: Negocio sin coordenadas lat/lng
  47  |     //   - [google-map-error]:   Sin API Key (entorno de test sin cuota de Google Cloud)
  48  |     // Cualquiera de los 3 indica que el componente renderizó correctamente sin crash.
  49  |     const mapContainer = page.locator(
  50  |       '[data-testid="google-map"], [data-testid="location-not-found"], [data-testid="google-map-error"]'
  51  |     ).first();
> 52  |     await expect(mapContainer).toBeVisible({ timeout: 15000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  53  | 
  54  |     // 5. Booking Widget Validation (CRITICAL FOR CONVERSION)
  55  |     const bookingWidget = page.locator('div:has-text("Agenda tu Cita")').first();
  56  |     if (await bookingWidget.isVisible()) {
  57  |         await expect(bookingWidget).toBeVisible();
  58  |         const bookingButton = bookingWidget.locator('a');
  59  |         await expect(bookingButton).toBeVisible();
  60  |         await expect(bookingButton).toHaveClass(/bg-primary|bg-green-500/);
  61  |     } else {
  62  |         console.log("ℹ️ This business has no booking widget (expected for some types).");
  63  |     }
  64  | 
  65  |     // 6. Website Portlet Validation
  66  |     if (await page.locator('h3:has-text("Experiencia Web")').isVisible()) {
  67  |         const websiteContainer = page.locator('div:has-text("Experiencia Web")').first();
  68  |         await expect(websiteContainer).toBeVisible();
  69  |     }
  70  | 
  71  |     // 7. Horarios Encoding Validation
  72  |     if (await page.locator('h4:has-text("Horarios Actualizados")').isVisible()) {
  73  |         const horariosText = await page.locator('p:near(h4:has-text("Horarios Actualizados"))').innerText();
  74  |         // Check for common UTF-8 encoding corruptions
  75  |         expect(horariosText).not.toMatch(/Ã|Â/);
  76  |     }
  77  | 
  78  |     // 8. Asset Integrity (Railway/Strapi)
  79  |     const images = page.locator('img');
  80  |     const imageCount = await images.count();
  81  |     for (let i = 0; i < imageCount; i++) {
  82  |       const isLoaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
  83  |         return img.complete && img.naturalWidth > 0;
  84  |       });
  85  |       if (!isLoaded) {
  86  |           const src = await images.nth(i).getAttribute('src');
  87  |           console.warn(`Potential asset error: ${src}`);
  88  |       }
  89  |     }
  90  |   });
  91  | 
  92  |   test('Verify Contact Route is Active (No 404)', async ({ page, isMobile }) => {
  93  |     // Navigate throught Home
  94  |     await page.goto('/', { waitUntil: 'networkidle' });
  95  |     await page.waitForLoadState('load');
  96  | 
  97  |     if (isMobile) {
  98  |         // Mobile Menu flow
  99  |         await page.click('button:has(svg.lucide-menu), button:has(svg.lucide-menu-line)');
  100 |         await page.waitForTimeout(1000); // More time for mobile menu
  101 |         await page.getByRole('link', { name: "Vende con nosotros" }).click({ force: true });
  102 |     } else {
  103 |         // Desktop Link
  104 |         await page.getByRole('link', { name: "Vende aquí" }).click({ force: true });
  105 |     }
  106 |     
  107 |     await page.waitForURL('**/contacto', { timeout: 15000 });
  108 |     await expect(page.url()).toContain('/contacto');
  109 |     await expect(page.getByRole('heading', { name: /Haz crecer tu Negocio/i })).toBeVisible();
  110 |   });
  111 | 
  112 |   test('Bulk Sweep: Verify 20 Businesses without crashing or encoding errors', async ({ page }) => {
  113 |     test.setTimeout(120000); // 2 minutos para escanear 20 negocios
  114 |     await page.goto('/');
  115 |     
  116 |     // Recolectar 20 links de negocios aleatorios de la home
  117 |     await page.waitForLoadState('networkidle');
  118 |     const cards = page.locator('a[href^="/negocios/"]');
  119 |     await cards.first().waitFor({ state: 'visible' });
  120 |     const count = await cards.count();
  121 |     
  122 |     expect(count).toBeGreaterThan(0);
  123 |     
  124 |     const maxToTest = Math.min(20, count);
  125 |     const urlsToTest = new Set<string>();
  126 |     
  127 |     for(let i = 0; i < count && urlsToTest.size < maxToTest; i++) {
  128 |         const href = await cards.nth(i).getAttribute('href');
  129 |         if (href) urlsToTest.add(href);
  130 |     }
  131 | 
  132 |     console.log(`Sweeping ${urlsToTest.size} businesses...`);
  133 | 
  134 |     for (const url of urlsToTest) {
  135 |         await page.goto(url);
  136 |         await page.waitForLoadState('domcontentloaded');
  137 |         
  138 |         // 1. Debe haber cargado la página (h1 presente)
  139 |         await expect(page.locator('h1').first()).toBeVisible();
  140 |         
  141 |         // 2. Revisar si hay horarios, que no tengan encoding corrupto
  142 |         const horariosSection = page.locator('div:has-text("Horarios Actualizados")').last();
  143 |         if (await horariosSection.isVisible()) {
  144 |             const text = await horariosSection.innerText();
  145 |             expect(text).not.toMatch(/Ã|Â/);
  146 |         }
  147 | 
  148 |         // 3. Revisar botón de Reservar (sin overflow a nivel DOM)
  149 |         const bookingBtn = page.locator('a:has-text("Reservar Ahora"), a:has-text("Consultar Cita")').first();
  150 |         if (await bookingBtn.isVisible()) {
  151 |              await expect(bookingBtn).toBeVisible();
  152 |         }
```