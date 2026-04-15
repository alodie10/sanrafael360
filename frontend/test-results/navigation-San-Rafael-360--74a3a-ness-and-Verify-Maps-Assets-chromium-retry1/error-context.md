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

Locator: locator('div:has-text("Agenda tu Cita")').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div:has-text("Agenda tu Cita")').first()

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
        - img "Cabañas Frutos Deliciosos- Rama Caída" [ref=e41]
        - link "Volver" [ref=e44] [cursor=pointer]:
          - /url: /
          - img [ref=e45]
          - generic [ref=e47]: Volver
        - generic [ref=e49]:
          - img "Cabañas Frutos Deliciosos- Rama Caída" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - img [ref=e54]
              - img [ref=e56]
              - img [ref=e58]
              - img [ref=e60]
              - img [ref=e62]
              - generic [ref=e64]: (4.8 / 5.0)
            - heading "Cabañas Frutos Deliciosos- Rama Caída" [level=1] [ref=e65]
            - generic [ref=e66]:
              - generic [ref=e67]:
                - img [ref=e68]
                - generic [ref=e71]: R. Nac. 143 km 513 – Rama Caída
              - generic [ref=e72]: Cabañas
      - generic [ref=e74]:
        - generic [ref=e75]:
          - generic [ref=e76]:
            - heading "Descripción" [level=2] [ref=e77]: Descripción
            - generic [ref=e79]: Cabañas Frutos Deliciosos- Rama Caída en San Rafael.
          - generic [ref=e80]:
            - heading "Experiencia Web" [level=2] [ref=e81]:
              - img [ref=e82]
              - text: Experiencia Web
            - generic [ref=e85]:
              - generic [ref=e86]:
                - generic [ref=e87]:
                  - img [ref=e88]
                  - img [ref=e90]
                  - img [ref=e92]
                - generic [ref=e94]:
                  - img [ref=e95]
                  - generic [ref=e98]: http://frutosdeliciosos.com.ar/cabanas/
                - img [ref=e99]
              - img "Preview de Cabañas Frutos Deliciosos- Rama Caída" [ref=e105]
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - img "frutosdeliciosos.com.ar" [ref=e109]
                  - generic [ref=e110]:
                    - generic [ref=e111]:
                      - img [ref=e112]
                      - generic [ref=e115]: Sitio Oficial
                    - paragraph [ref=e116]: frutosdeliciosos.com.ar
                - link "Visitar sitio" [ref=e117] [cursor=pointer]:
                  - /url: http://frutosdeliciosos.com.ar/cabanas/
                  - img [ref=e118]
                  - generic [ref=e122]: Visitar sitio
        - generic [ref=e124]:
          - generic [ref=e125]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e126]
            - paragraph [ref=e127]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e128] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e129]
          - link [ref=e132] [cursor=pointer]:
            - /url: https://www.instagram.com/fruto.sdeliciosos/?hl=es
            - img [ref=e134]
          - generic [ref=e137]:
            - generic [ref=e138]:
              - heading "Ubicación" [level=4] [ref=e139]
              - link "Ver en Maps" [ref=e140] [cursor=pointer]:
                - /url: https://www.google.com/maps/search/?api=1&query=-34.6612192,-68.36495339999999
                - text: Ver en Maps
                - img [ref=e141]
            - generic [ref=e148]:
              - generic:
                - button "Combinaciones de teclas"
              - region "Mapa" [ref=e149]
              - generic [ref=e150]:
                - generic [ref=e168]:
                  - generic:
                    - generic:
                      - generic:
                        - img "Cabañas Frutos Deliciosos- Rama Caída"
                - iframe [ref=e170]:
                  
                - button "Cambiar a la vista en pantalla completa" [ref=e171] [cursor=pointer]
                - generic:
                  - generic:
                    - button "Controles de visualización del mapa" [ref=e173] [cursor=pointer]
                    - button "Arrastra al hombrecito al mapa para abrir Street View" [ref=e174] [cursor=pointer]:
                      - generic:
                        - img "Control del hombrecito de Street View"
                    - generic [ref=e176] [cursor=pointer]:
                      - button "Ampliar" [ref=e177]
                      - button "Reducir" [ref=e179]
                - link "Abre esta zona en Google Maps (se abre en una nueva ventana)" [ref=e181] [cursor=pointer]:
                  - /url: https://maps.google.com/maps?ll=-34.661219,-68.364953&z=15&t=m&hl=es&gl=US&mapclient=apiv3
                  - img "Google" [ref=e183]
                - generic [ref=e184]:
                  - button "Combinaciones de teclas" [ref=e190] [cursor=pointer]
                  - button "Datos del mapa" [ref=e196] [cursor=pointer]
                  - link "Términos (se abre en una nueva pestaña)" [ref=e201] [cursor=pointer]:
                    - /url: https://www.google.com/intl/es_US/help/terms_maps.html
                    - text: Términos
                  - link "Informar a Google acerca de errores en las imágenes o en el mapa de carreteras" [ref=e206] [cursor=pointer]:
                    - /url: https://www.google.com/maps/@-34.6612192,-68.3649534,15z/data=!10m1!1e1!12b1?source=apiv3&rapsrc=apiv3
  - button "Open Next.js Dev Tools" [ref=e212] [cursor=pointer]:
    - img [ref=e213]
  - alert [ref=e216]
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
> 48  |     await expect(bookingWidget).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
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
  95  |     await expect(page.url()).toContain('/contacto');
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