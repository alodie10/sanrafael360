# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> San Rafael 360 - Critical Flow Validation >> Verify Contact Route is Active (No 404)
- Location: tests/navigation.spec.ts:84:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/contacto"
Received string:    "http://localhost:3000/"
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - link "Vende aquí" [active] [ref=e19] [cursor=pointer]:
            - /url: /contacto
            - img [ref=e20]
            - text: Vende aquí
    - main [ref=e21]:
      - generic [ref=e22]:
        - img "San Rafael" [ref=e25]
        - generic [ref=e27]:
          - heading "Vive San Rafael" [level=1] [ref=e28]:
            - text: Vive
            - generic [ref=e29]: San Rafael
          - paragraph [ref=e30]: Encuentra las mejores experiencias, gastronomía y alojamiento en el corazón de Mendoza.
          - generic [ref=e33]:
            - generic [ref=e34]:
              - img [ref=e35]
              - textbox "¿Qué estás buscando hoy?" [ref=e38]
            - button "Explorar" [ref=e39] [cursor=pointer]
      - generic [ref=e42]:
        - button "Todos" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - generic [ref=e49]: Todos
        - button "Agencias de Viaje" [ref=e50] [cursor=pointer]:
          - img [ref=e51]
          - generic [ref=e54]: Agencias de Viaje
        - button "Apart Hoteles" [ref=e55] [cursor=pointer]:
          - img [ref=e56]
          - generic [ref=e59]: Apart Hoteles
        - button "Bodegas" [ref=e60] [cursor=pointer]:
          - img [ref=e61]
          - generic [ref=e63]: Bodegas
        - button "Cabañas" [ref=e64] [cursor=pointer]:
          - img [ref=e65]
          - generic [ref=e67]: Cabañas
        - button "Gastronomía" [ref=e68] [cursor=pointer]:
          - img [ref=e69]
          - generic [ref=e72]: Gastronomía
        - button "Hostels" [ref=e73] [cursor=pointer]:
          - img [ref=e74]
          - generic [ref=e79]: Hostels
        - button "Hoteles" [ref=e80] [cursor=pointer]:
          - img [ref=e81]
          - generic [ref=e84]: Hoteles
        - button "Posadas" [ref=e85] [cursor=pointer]:
          - img [ref=e86]
          - generic [ref=e89]: Posadas
        - button "Productos Gourmet" [ref=e90] [cursor=pointer]:
          - img [ref=e91]
          - generic [ref=e97]: Productos Gourmet
      - generic [ref=e98]:
        - generic [ref=e100]:
          - generic [ref=e101]:
            - heading "Explorar por Categoría" [level=2] [ref=e102]
            - paragraph [ref=e103]: Descubre San Rafael según tus intereses y necesidades.
          - button "Ver todas" [ref=e104] [cursor=pointer]:
            - text: Ver todas
            - img [ref=e105]
        - generic [ref=e113]:
          - generic [ref=e114]:
            - heading "Comercios Destacados" [level=2] [ref=e115]
            - paragraph [ref=e116]: Seleccionamos las mejores opciones locales para que tu estadía en San Rafael sea inolvidable.
          - button "Explorar Guía Completa" [ref=e117] [cursor=pointer]:
            - text: Explorar Guía Completa
            - img [ref=e118]
  - button "Open Next.js Dev Tools" [ref=e240] [cursor=pointer]:
    - img [ref=e241]
  - alert [ref=e244]
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
  44  |     await expect(mapContainer).toBeVisible();
  45  | 
  46  |     // 5. Booking Widget Validation (CRITICAL FOR CONVERSION)
  47  |     const bookingWidget = page.locator('div:has-text("Agenda tu Cita")').first();
  48  |     await expect(bookingWidget).toBeVisible();
  49  |     const bookingButton = bookingWidget.locator('a');
  50  |     await expect(bookingButton).toBeVisible();
  51  |     await expect(bookingButton).toHaveClass(/bg-primary|bg-green-500/);
  52  | 
  53  |     // 6. Website Portlet Validation
  54  |     if (await page.locator('h3:has-text("Experiencia Web")').isVisible()) {
  55  |         const websiteContainer = page.locator('div:has-text("Experiencia Web")').first();
  56  |         await expect(websiteContainer).toBeVisible();
  57  |     }
  58  | 
  59  |     // 7. Horarios Encoding Validation
  60  |     if (await page.locator('h4:has-text("Horarios Actualizados")').isVisible()) {
  61  |         const horariosText = await page.locator('p:near(h4:has-text("Horarios Actualizados"))').innerText();
  62  |         // Check for common UTF-8 encoding corruptions
  63  |         expect(horariosText).not.toMatch(/Ã|Â/);
  64  |     }
  65  | 
  66  |     // 7. Asset Integrity (Railway/Strapi)
  67  |     // Check for images and ensure they don't have naturalWidth 0 (indicates error/CORS block)
  68  |     const images = page.locator('img');
  69  |     const imageCount = await images.count();
  70  |     
  71  |     for (let i = 0; i < imageCount; i++) {
  72  |       const isLoaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
  73  |         return img.complete && img.naturalWidth > 0;
  74  |       });
  75  |       // We log but don't strictly fail for placeholders if some business lacks images,
  76  |       // but if ALL fail, we should be concerned.
  77  |       if (!isLoaded) {
  78  |           const src = await images.nth(i).getAttribute('src');
  79  |           console.warn(`Potential asset error: ${src}`);
  80  |       }
  81  |     }
  82  |   });
  83  | 
  84  |   test('Verify Contact Route is Active (No 404)', async ({ page }) => {
  85  |     // Navigate to /contacto directly
  86  |     await page.goto('/contacto');
  87  |     
  88  |     // Check for the "Vende aquí" or similar heading
  89  |     await expect(page.getByRole('heading', { name: /Haz crecer tu Negocio/i })).toBeVisible();
  90  |     
  91  |     // Verify prefetching works by going home and clicking the link
  92  |     await page.goto('/');
  93  |     const contactLink = page.locator('nav a[href="/contacto"]').first();
  94  |     await contactLink.click();
> 95  |     await expect(page.url()).toContain('/contacto');
      |                              ^ Error: expect(received).toContain(expected) // indexOf
  96  |   });
  97  | 
  98  |   test('Bulk Sweep: Verify 20 Businesses without crashing or encoding errors', async ({ page }) => {
  99  |     test.setTimeout(120000); // 2 minutos para escanear 20 negocios
  100 |     await page.goto('/');
  101 |     
  102 |     // Recolectar 20 links de negocios aleatorios de la home
  103 |     await page.waitForLoadState('networkidle');
  104 |     const cards = page.locator('a[href^="/negocios/"]');
  105 |     await cards.first().waitFor({ state: 'visible' });
  106 |     const count = await cards.count();
  107 |     
  108 |     expect(count).toBeGreaterThan(0);
  109 |     
  110 |     const maxToTest = Math.min(20, count);
  111 |     const urlsToTest = new Set<string>();
  112 |     
  113 |     for(let i = 0; i < count && urlsToTest.size < maxToTest; i++) {
  114 |         const href = await cards.nth(i).getAttribute('href');
  115 |         if (href) urlsToTest.add(href);
  116 |     }
  117 | 
  118 |     console.log(`Sweeping ${urlsToTest.size} businesses...`);
  119 | 
  120 |     for (const url of urlsToTest) {
  121 |         await page.goto(url);
  122 |         await page.waitForLoadState('domcontentloaded');
  123 |         
  124 |         // 1. Debe haber cargado la página (h1 presente)
  125 |         await expect(page.locator('h1').first()).toBeVisible();
  126 |         
  127 |         // 2. Revisar si hay horarios, que no tengan encoding corrupto
  128 |         const horariosSection = page.locator('div:has-text("Horarios Actualizados")').last();
  129 |         if (await horariosSection.isVisible()) {
  130 |             const text = await horariosSection.innerText();
  131 |             expect(text).not.toMatch(/Ã|Â/);
  132 |         }
  133 | 
  134 |         // 3. Revisar botón de Reservar (sin overflow a nivel DOM)
  135 |         // Playwright asserts elements are visible and within viewport bounds automatically if we click, 
  136 |         // but we just assert it's visible.
  137 |         const bookingBtn = page.locator('a:has-text("Reservar Ahora"), a:has-text("Consultar Cita")').first();
  138 |         if (await bookingBtn.isVisible()) {
  139 |              // Just verifying it renders
  140 |              await expect(bookingBtn).toBeVisible();
  141 |         }
  142 |     }
  143 |   });
  144 | 
  145 | });
  146 | 
```