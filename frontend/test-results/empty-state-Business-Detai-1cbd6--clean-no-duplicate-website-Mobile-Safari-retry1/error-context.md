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
Received string:  "Horarios Actualizados
"
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
        - img "LA DELICIA BULEVARD - Ciudad" [ref=e25]
        - link "Volver" [ref=e28]:
          - /url: /
          - img [ref=e29]
          - generic [ref=e31]: Volver
        - generic [ref=e33]:
          - img "LA DELICIA BULEVARD - Ciudad" [ref=e35]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - img [ref=e38]
              - img [ref=e40]
              - img [ref=e42]
              - img [ref=e44]
              - img [ref=e46]
              - generic [ref=e48]: (4.8 / 5.0)
            - heading "LA DELICIA BULEVARD - Ciudad" [level=1] [ref=e49]
            - generic [ref=e50]:
              - generic [ref=e51]:
                - img [ref=e52]
                - generic [ref=e55]: H. Yrigoyen 1594 – Ciudad
              - generic [ref=e56]: Gastronomía
      - generic [ref=e58]:
        - generic [ref=e59]:
          - generic [ref=e60]:
            - heading "Descripción" [level=2] [ref=e61]: Descripción
            - generic [ref=e63]: LA DELICIA BULEVARD - Ciudad en San Rafael.
          - generic [ref=e64]:
            - heading "Experiencia Web" [level=2] [ref=e65]:
              - img [ref=e66]
              - text: Experiencia Web
            - generic [ref=e69]:
              - generic [ref=e70]:
                - generic [ref=e71]:
                  - img [ref=e72]
                  - img [ref=e74]
                  - img [ref=e76]
                - generic [ref=e78]:
                  - img [ref=e79]
                  - generic [ref=e82]: https://ladeliciaboulevard.com.ar
                - img [ref=e83]
              - generic [ref=e91]:
                - img [ref=e93]
                - paragraph [ref=e96]: Cargando experiencia…
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - img "ladeliciaboulevard.com.ar" [ref=e100]
                  - generic [ref=e101]:
                    - generic [ref=e102]:
                      - img [ref=e103]
                      - generic [ref=e106]: Sitio Oficial
                    - paragraph [ref=e107]: ladeliciaboulevard.com.ar
                - link "Visitar sitio" [ref=e108]:
                  - /url: https://ladeliciaboulevard.com.ar
                  - img [ref=e109]
                  - generic [ref=e113]: Visitar sitio
        - generic [ref=e115]:
          - generic [ref=e116]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e117]
            - paragraph [ref=e118]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e119] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e120]
          - generic [ref=e122]:
            - link [ref=e123]:
              - /url: https://www.instagram.com/ladeliciadelboulevard/
              - img [ref=e125]
            - link [ref=e128]:
              - /url: https://www.facebook.com/ladeliciadelboulevard
              - img [ref=e129]
          - generic [ref=e132]:
            - heading "Ubicación" [level=4] [ref=e133]
            - link "Ver en Maps" [ref=e134]:
              - /url: https://www.google.com/maps/search/?api=1&query=-34.6093171,-68.3494016
              - text: Ver en Maps
              - img [ref=e135]
          - generic [ref=e144]:
            - generic [ref=e145]:
              - img [ref=e146]
              - generic [ref=e149]: Horarios Actualizados
            - paragraph [ref=e150]: "Lunes a Sábado: 08:00 - 00:00 | Domingo: 18:00 - 00:00"
  - button "Open Next.js Dev Tools" [ref=e156] [cursor=pointer]:
    - img [ref=e157]
  - alert [ref=e162]
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