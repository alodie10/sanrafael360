# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empty-state.spec.ts >> Business Detail — Empty State Regression >> La Delicia Bulevar: no black columns, horarios clean, no duplicate website
- Location: tests/empty-state.spec.ts:13:7

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /Sábado|Lunes|Martes|Miércoles|Jueves|Viernes|Domingo/i
Received string:  "Horarios Actualizados"
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
        - img "LA DELICIA BULEVARD - Ciudad" [ref=e41]
        - link "Volver" [ref=e44] [cursor=pointer]:
          - /url: /
          - img [ref=e45]
          - generic [ref=e47]: Volver
        - generic [ref=e49]:
          - img "LA DELICIA BULEVARD - Ciudad" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - img [ref=e54]
              - img [ref=e56]
              - img [ref=e58]
              - img [ref=e60]
              - img [ref=e62]
              - generic [ref=e64]: (4.8 / 5.0)
            - heading "LA DELICIA BULEVARD - Ciudad" [level=1] [ref=e65]
            - generic [ref=e66]:
              - generic [ref=e67]:
                - img [ref=e68]
                - generic [ref=e71]: H. Yrigoyen 1594 – Ciudad
              - generic [ref=e72]: Gastronomía
      - generic [ref=e74]:
        - generic [ref=e75]:
          - generic [ref=e76]:
            - heading "Descripción" [level=2] [ref=e77]: Descripción
            - generic [ref=e79]: LA DELICIA BULEVARD - Ciudad en San Rafael.
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
                  - generic [ref=e98]: https://ladeliciaboulevard.com.ar
                - img [ref=e99]
              - generic [ref=e107]:
                - img [ref=e109]
                - paragraph [ref=e112]: Cargando experiencia…
              - generic [ref=e113]:
                - generic [ref=e114]:
                  - img "ladeliciaboulevard.com.ar" [ref=e116]
                  - generic [ref=e117]:
                    - generic [ref=e118]:
                      - img [ref=e119]
                      - generic [ref=e122]: Sitio Oficial
                    - paragraph [ref=e123]: ladeliciaboulevard.com.ar
                - link "Visitar sitio" [ref=e124] [cursor=pointer]:
                  - /url: https://ladeliciaboulevard.com.ar
                  - img [ref=e125]
                  - generic [ref=e129]: Visitar sitio
        - generic [ref=e131]:
          - generic [ref=e132]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e133]
            - paragraph [ref=e134]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e135] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e136]
          - generic [ref=e138]:
            - link [ref=e139] [cursor=pointer]:
              - /url: https://www.instagram.com/ladeliciadelboulevard/
              - img [ref=e141]
            - link [ref=e144] [cursor=pointer]:
              - /url: https://www.facebook.com/ladeliciadelboulevard
              - img [ref=e145]
          - generic [ref=e148]:
            - heading "Ubicación" [level=4] [ref=e149]
            - link "Ver en Maps" [ref=e150] [cursor=pointer]:
              - /url: https://www.google.com/maps/search/?api=1&query=-34.6093171,-68.3494016
              - text: Ver en Maps
              - img [ref=e151]
          - generic [ref=e160]:
            - generic [ref=e161]:
              - img [ref=e162]
              - generic [ref=e165]: Horarios Actualizados
            - paragraph [ref=e166]: "Lunes a Sábado: 08:00 - 00:00 | Domingo: 18:00 - 00:00"
  - button "Open Next.js Dev Tools" [ref=e172] [cursor=pointer]:
    - img [ref=e173]
  - alert [ref=e176]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Empty-State Regression Suite
  5   |  * 
  6   |  * Valida que las páginas de negocios con datos mínimos (sin descripción,
  7   |  * sin reservaUrl, sin galería) se rendericen sin áreas negras ni mecanismos vacíos.
  8   |  * 
  9   |  * Target: https://sanrafael360.vercel.app (siempre contra producción)
  10  |  */
  11  | test.describe('Business Detail — Empty State Regression', () => {
  12  | 
  13  |   test('La Delicia Bulevar: no black columns, horarios clean, no duplicate website', async ({ page }) => {
  14  |     test.setTimeout(60000);
  15  | 
  16  |     await page.goto('/negocios/la-delicia-bulevard-ciudad');
  17  |     
  18  |     // 1. Página cargó correctamente (esperar a que desaparezca el loading y aparezca el h1)
  19  |     await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });
  20  | 
  21  | 
  22  |     // 2. La columna principal no está vacía — debe haber al menos UNO de estos elementos:
  23  |     //    - Descripción (texto)
  24  |     //    - Placeholder glassmorphic ("próximamente")
  25  |     //    - WebsitePortlet ("Experiencia Web")
  26  |     const mainColumn = page.locator('.lg\\:col-span-2');
  27  |     await expect(mainColumn).toBeVisible();
  28  | 
  29  |     // Esperar a que alguno de los contenidos esperados aparezca
  30  |     const contentPromise = Promise.any([
  31  |         page.getByText('Experiencia Web').waitFor({ state: 'visible', timeout: 10000 }),
  32  |         page.getByText('próximamente').waitFor({ state: 'visible', timeout: 10000 }),
  33  |         page.locator('.lg\\:col-span-2 >> text=/La Delicia/i').waitFor({ state: 'visible', timeout: 10000 })
  34  |     ]);
  35  |     
  36  |     await expect(contentPromise).resolves.not.toThrow();
  37  | 
  38  |     // 3. Horarios sin encoding corrupto
  39  |     const horariosSection = page.locator('text=Horarios Actualizados');
  40  |     if (await horariosSection.isVisible()) {
  41  |       const parent = await horariosSection.locator('xpath=..');
  42  |       const text = await parent.innerText();
  43  |       expect(text).not.toMatch(/Ã|Â/);
> 44  |       expect(text).toMatch(/Sábado|Lunes|Martes|Miércoles|Jueves|Viernes|Domingo/i);
      |                    ^ Error: expect(received).toMatch(expected)
  45  |     }
  46  | 
  47  |     // 4. NO debe haber el link duplicado "Visitar sitio oficial" en el sidebar
  48  |     const duplicateLink = page.locator('text=Visitar sitio oficial');
  49  |     await expect(duplicateLink).not.toBeVisible();
  50  |   });
  51  | 
  52  |   test('Negocio sin reservaUrl válida: BookingWidget NO debe renderizarse', async ({ page }) => {
  53  |     test.setTimeout(60000);
  54  | 
  55  |     // Buscamos un negocio que típicamente no tenga reservaUrl (cabañas pequeñas, etc.)
  56  |     // Usamos un negocio conocido sin sistema de reservas online
  57  |     await page.goto('/negocios/cabanas-del-sur-rama-caida');
  58  |     
  59  |     // Esperar a que el contenido cargue
  60  |     await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });
  61  | 
  62  | 
  63  |     // El BookingWidget con "Reservar Ahora" no debe aparecer si no hay reservaUrl válida
  64  |     const reservarAhoraBtn = page.locator('text=Reservar Ahora');
  65  |     const consultarCitaBtn = page.locator('text=Consultar Cita');
  66  | 
  67  |     const hasReservar = await reservarAhoraBtn.isVisible();
  68  |     const hasConsultar = await consultarCitaBtn.isVisible();
  69  | 
  70  |     if (hasReservar) {
  71  |       // Si existe, debe tener un href válido
  72  |       const href = await reservarAhoraBtn.locator('..').getAttribute('href');
  73  |       expect(href).toBeTruthy();
  74  |       expect(() => new URL(href!)).not.toThrow();
  75  |     }
  76  | 
  77  |     if (hasConsultar) {
  78  |       // Si existe, debe apuntar a wa.me con número válido
  79  |       const href = await consultarCitaBtn.locator('..').getAttribute('href');
  80  |       expect(href).toMatch(/^https:\/\/wa\.me\/\d{10,}/);
  81  |     }
  82  |   });
  83  | 
  84  |   test('WebsitePortlet: favicon fallback no rompe la página', async ({ page }) => {
  85  |     test.setTimeout(60000);
  86  | 
  87  |     await page.goto('/negocios/la-delicia-bulevard-ciudad');
  88  |     await page.waitForLoadState('networkidle');
  89  | 
  90  |     // El portlet debe estar visible
  91  |     const portlet = page.locator('text=Experiencia Web');
  92  |     await expect(portlet).toBeVisible();
  93  | 
  94  |     // El botón "Visitar" debe ser clickeable (tiene href válido)
  95  |     const visitarBtn = page.locator('a:has-text("Visitar")').first();
  96  |     if (await visitarBtn.isVisible()) {
  97  |       const href = await visitarBtn.getAttribute('href');
  98  |       expect(href).toBeTruthy();
  99  |       expect(() => new URL(href!)).not.toThrow();
  100 |     }
  101 | 
  102 |     // No debe haber errores críticos de hydration en consola
  103 |     const consoleLogs: string[] = [];
  104 |     page.on('console', msg => {
  105 |       if (msg.type() === 'error') consoleLogs.push(msg.text());
  106 |     });
  107 | 
  108 |     await page.waitForTimeout(2000);
  109 | 
  110 |     const hydrationErrors = consoleLogs.filter(log =>
  111 |       log.includes('Hydration') || log.includes('did not match')
  112 |     );
  113 |     expect(hydrationErrors.length, `Hydration errors: ${hydrationErrors.join(', ')}`).toBe(0);
  114 |   });
  115 | 
  116 | });
  117 | 
```