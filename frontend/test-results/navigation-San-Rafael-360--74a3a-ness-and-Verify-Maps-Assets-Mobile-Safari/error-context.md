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

Locator: locator('.relative.w-full.h-full.min-h-\\[300px\\]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.relative.w-full.h-full.min-h-\\[300px\\]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "San Rafael 360 San Rafael 360" [ref=e5]:
          - /url: /
          - img "San Rafael 360" [ref=e7]
          - generic [ref=e8]: San Rafael 360
        - generic [ref=e9]:
          - link "Entrar" [ref=e10]:
            - /url: /login
          - button [ref=e11] [cursor=pointer]:
            - img [ref=e12]
    - main [ref=e13]:
      - navigation [ref=e14]:
        - generic [ref=e15]:
          - link "San Rafael 360 San Rafael 360" [ref=e16]:
            - /url: /
            - img "San Rafael 360" [ref=e18]
            - generic [ref=e19]: San Rafael 360
          - generic [ref=e20]:
            - link "Entrar" [ref=e21]:
              - /url: /login
            - button [ref=e22] [cursor=pointer]:
              - img [ref=e23]
      - generic [ref=e24]:
        - img "LA MANSA WINE ESTATES - Cuadro Nacional" [ref=e25]
        - link "Volver" [ref=e28]:
          - /url: /
          - img [ref=e29]
          - generic [ref=e31]: Volver
        - generic [ref=e33]:
          - img "LA MANSA WINE ESTATES - Cuadro Nacional" [ref=e35]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - img [ref=e38]
              - img [ref=e40]
              - img [ref=e42]
              - img [ref=e44]
              - img [ref=e46]
              - generic [ref=e48]: (4.8 / 5.0)
            - heading "LA MANSA WINE ESTATES - Cuadro Nacional" [level=1] [ref=e49]
            - generic [ref=e50]:
              - generic [ref=e51]:
                - img [ref=e52]
                - generic [ref=e55]: "\"Ruta 146 km 383"
              - generic [ref=e56]: Bodegas
      - generic [ref=e58]:
        - generic [ref=e60]:
          - heading "Descripción" [level=2] [ref=e61]: Descripción
          - generic [ref=e63]: LA MANSA WINE ESTATES - Cuadro Nacional en San Rafael.
        - generic [ref=e65]:
          - generic [ref=e66]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e67]
            - paragraph [ref=e68]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e69] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e70]
          - generic [ref=e71]:
            - link "Teléfono 5 – Cuadro Nacional\"" [ref=e72]:
              - /url: tel:5 – Cuadro Nacional"
              - generic [ref=e73]:
                - img [ref=e75]
                - generic [ref=e77]:
                  - paragraph [ref=e78]: Teléfono
                  - paragraph [ref=e79]: 5 – Cuadro Nacional"
            - generic [ref=e80]:
              - link [ref=e81]:
                - /url: http://www.lamansa.com.ar
                - img [ref=e83]
              - link [ref=e86]:
                - /url: https://www.instagram.com/lamansawines/?hl=es-la
                - img [ref=e87]
          - generic [ref=e89]:
            - generic [ref=e90]:
              - heading "Ubicación" [level=4] [ref=e91]
              - link "Ver en Maps" [ref=e92]:
                - /url: https://www.google.com/maps/search/?api=1&query=-34.6315638,-68.2179958
                - text: Ver en Maps
                - img [ref=e93]
            - paragraph [ref=e99]: Falta la API Key de Google Maps
  - button "Open Next.js Dev Tools" [ref=e105] [cursor=pointer]:
    - img [ref=e106]
  - alert [ref=e111]
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
  17  |     await page.goto('/');
  18  |     
  19  |     // Validate Hero Title
  20  |     await expect(page.getByRole('heading', { name: /San Rafael/i })).toBeVisible();
  21  | 
  22  |     // 2. Select a Random Business Card
  23  |     const cards = page.locator('a[href^="/negocios/"]');
  24  |     await cards.first().waitFor({ state: 'visible' });
  25  |     const count = await cards.count();
  26  |     const randomIndex = Math.floor(Math.random() * count);
  27  |     const randomCard = cards.nth(randomIndex);
  28  |     
  29  |     const businessName = await randomCard.innerText();
  30  |     console.log(`Diving into: ${businessName}`);
  31  | 
  32  |     // 3. Click and Navigate
  33  |     await randomCard.click();
  34  |     
  35  |     // 4. Wait for the business name to be visible (client-side rendering)
  36  |     await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });
  37  | 
  38  |     // Verify status 200 by checking the page content (Next.js 404 would show error state)
  39  |     await expect(page.locator('h1')).toBeVisible();
  40  | 
  41  |     // 4. Google Maps Validation
  42  |     // Check if the container exists
  43  |     const mapContainer = page.locator('.relative.w-full.h-full.min-h-\\[300px\\]');
> 44  |     await expect(mapContainer).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  45  | 
  46  |     // 5. Booking Widget Validation (CRITICAL FOR CONVERSION)
  47  |     // Some businesses don't have a booking URL, so we make this check conditional 
  48  |     // but ensure that IF it's visible, it has the right structure.
  49  |     const bookingWidget = page.locator('div:has-text("Agenda tu Cita")').first();
  50  |     if (await bookingWidget.isVisible()) {
  51  |         await expect(bookingWidget).toBeVisible();
  52  |         const bookingButton = bookingWidget.locator('a');
  53  |         await expect(bookingButton).toBeVisible();
  54  |         await expect(bookingButton).toHaveClass(/bg-primary|bg-green-500/);
  55  |     } else {
  56  |         console.log("ℹ️ This business has no booking widget (expected for some types).");
  57  |     }
  58  | 
  59  |     // 6. Website Portlet Validation
  60  |     if (await page.locator('h3:has-text("Experiencia Web")').isVisible()) {
  61  |         const websiteContainer = page.locator('div:has-text("Experiencia Web")').first();
  62  |         await expect(websiteContainer).toBeVisible();
  63  |     }
  64  | 
  65  |     // 7. Horarios Encoding Validation
  66  |     if (await page.locator('h4:has-text("Horarios Actualizados")').isVisible()) {
  67  |         const horariosText = await page.locator('p:near(h4:has-text("Horarios Actualizados"))').innerText();
  68  |         // Check for common UTF-8 encoding corruptions
  69  |         expect(horariosText).not.toMatch(/Ã|Â/);
  70  |     }
  71  | 
  72  |     // 7. Asset Integrity (Railway/Strapi)
  73  |     // Check for images and ensure they don't have naturalWidth 0 (indicates error/CORS block)
  74  |     const images = page.locator('img');
  75  |     const imageCount = await images.count();
  76  |     
  77  |     for (let i = 0; i < imageCount; i++) {
  78  |       const isLoaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
  79  |         return img.complete && img.naturalWidth > 0;
  80  |       });
  81  |       // We log but don't strictly fail for placeholders if some business lacks images,
  82  |       // but if ALL fail, we should be concerned.
  83  |       if (!isLoaded) {
  84  |           const src = await images.nth(i).getAttribute('src');
  85  |           console.warn(`Potential asset error: ${src}`);
  86  |       }
  87  |     }
  88  |   });
  89  | 
  90  |   test('Verify Contact Route is Active (No 404)', async ({ page, isMobile }) => {
  91  |     // Navigate to /contacto directly first
  92  |     await page.goto('/contacto');
  93  |     await expect(page.getByRole('heading', { name: /Haz crecer tu Negocio/i })).toBeVisible();
  94  |     
  95  |     // Verify navigation works from Home
  96  |     await page.goto('/');
  97  |     
  98  |     if (isMobile) {
  99  |         // Mobile Menu flow
  100 |         await page.click('button:has(svg.lucide-menu), button:has(svg.lucide-menu-line)');
  101 |         await page.waitForTimeout(1000); // More time for mobile menu
  102 |         await page.getByRole('link', { name: "Vende con nosotros" }).click({ force: true });
  103 |     } else {
  104 |         // Desktop Link
  105 |         await page.getByRole('link', { name: "Vende aquí" }).click({ force: true });
  106 |     }
  107 |     
  108 |     await page.waitForURL('**/contacto', { timeout: 15000 });
  109 |     await expect(page.url()).toContain('/contacto');
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
```