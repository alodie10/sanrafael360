# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: claim-flow.spec.ts >> Flujo de Reclamo de Negocio >> debe exigir documentación mandatoria para reclamar un negocio
- Location: tests/claim-flow.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Tu solicitud de reclamo está pendiente de aprobación.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Tu solicitud de reclamo está pendiente de aprobación.')

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
          - link [ref=e10]:
            - /url: /portal
            - img [ref=e11]
          - button [ref=e14] [cursor=pointer]:
            - img [ref=e15]
    - main [ref=e16]:
      - navigation [ref=e17]:
        - generic [ref=e18]:
          - link "San Rafael 360 San Rafael 360" [ref=e19]:
            - /url: /
            - img "San Rafael 360" [ref=e21]
            - generic [ref=e22]: San Rafael 360
          - generic [ref=e23]:
            - link [ref=e24]:
              - /url: /portal
              - img [ref=e25]
            - button [ref=e28] [cursor=pointer]:
              - img [ref=e29]
      - generic [ref=e30]:
        - img "Apart Hotel Ayum Elun Aldea de Río - Valle Grande" [ref=e31]
        - link "Volver" [ref=e34]:
          - /url: /
          - img [ref=e35]
          - generic [ref=e37]: Volver
        - generic [ref=e39]:
          - img "Apart Hotel Ayum Elun Aldea de Río - Valle Grande" [ref=e41]
          - generic [ref=e42]:
            - generic [ref=e43]:
              - img [ref=e44]
              - img [ref=e46]
              - img [ref=e48]
              - img [ref=e50]
              - img [ref=e52]
              - generic [ref=e54]: (4.8 / 5.0)
            - heading "Apart Hotel Ayum Elun Aldea de Río - Valle Grande" [level=1] [ref=e55]
            - generic [ref=e56]:
              - generic [ref=e57]:
                - img [ref=e58]
                - generic [ref=e61]: "\"Ruta Prov. 173 km 20"
              - generic [ref=e62]: Apart Hoteles
      - generic [ref=e64]:
        - generic [ref=e66]:
          - heading "Descripción" [level=2] [ref=e67]: Descripción
          - generic [ref=e69]: Apart Hotel Ayum Elun Aldea de Río - Valle Grande en San Rafael.
        - generic [ref=e71]:
          - generic [ref=e72]:
            - heading "¿Eres el dueño de este negocio?" [level=4] [ref=e73]
            - paragraph [ref=e74]: Reclama este perfil para administrar la información, responder comentarios y más.
            - button "Reclamar Perfil" [ref=e75] [cursor=pointer]
          - heading "Información Detallada" [level=3] [ref=e76]
          - generic [ref=e77]:
            - link "Teléfono 5 -Valle Grande\"" [ref=e78]:
              - /url: tel:5 -Valle Grande"
              - generic [ref=e79]:
                - img [ref=e81]
                - generic [ref=e83]:
                  - paragraph [ref=e84]: Teléfono
                  - paragraph [ref=e85]: 5 -Valle Grande"
            - link "WhatsApp Chatear ahora" [ref=e86]:
              - /url: https://wa.me/5492604538866
              - generic [ref=e87]:
                - img [ref=e89]
                - generic [ref=e91]:
                  - paragraph [ref=e92]: WhatsApp
                  - paragraph [ref=e93]: Chatear ahora
            - generic [ref=e94]:
              - link [ref=e95]:
                - /url: http://www.ayumelun.com/
                - img [ref=e97]
              - link [ref=e100]:
                - /url: https://www.instagram.com/ayumelun.aldeaderio/
                - img [ref=e101]
          - generic [ref=e103]:
            - generic [ref=e104]:
              - heading "Ubicación" [level=4] [ref=e105]
              - link "Ver en Maps" [ref=e106]:
                - /url: https://www.google.com/maps/search/?api=1&query=-34.8207162,-68.4475868
                - text: Ver en Maps
                - img [ref=e107]
            - paragraph [ref=e113]: Falta la API Key de Google Maps
      - generic [ref=e115]:
        - button "✕" [ref=e116] [cursor=pointer]
        - heading "Reclamar Negocio" [level=3] [ref=e117]
        - paragraph [ref=e118]:
          - text: Estás a un paso de tomar control de
          - strong [ref=e119]: Apart Hotel Ayum Elun Aldea de Río - Valle Grande
          - text: . Déjanos un mensaje con tu número de teléfono o una forma de validar que eres el dueño o representante legal.
        - 'textbox "Ej: Hola, soy el dueño de este local. Mi teléfono es 2604-XXXXXX." [ref=e120]': Prueba de reclamo mandatorio
        - generic [ref=e121]:
          - generic [ref=e122]: Documentación de propiedad (Obligatorio - PDF/ID)
          - generic [ref=e123]:
            - generic [ref=e124] [cursor=pointer]:
              - generic [ref=e125]: doc-prueba.txt
              - generic [ref=e126]: Subir
            - button "✕" [ref=e127] [cursor=pointer]
          - paragraph [ref=e128]: Adjunta una copia de tu inscripción fiscal, DNI o cualquier documento que acredite la propiedad.
        - generic [ref=e129]: El negocio ya tiene un reclamo en proceso o asignado a un propietario
        - generic [ref=e130]:
          - button "Cancelar" [ref=e131] [cursor=pointer]
          - button "Enviar Solicitud" [ref=e132] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e138] [cursor=pointer]:
    - img [ref=e139]
  - alert [ref=e144]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Flujo de Reclamo de Negocio', () => {
  4  |   
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // 1. Iniciar sesión con usuario de prueba
  7  |     await page.goto('/login');
  8  |     // Nota: El sistema usa NextAuth. Playwright requiere manejar el estado de autenticación.
  9  |     // Para simplificar, llenamos el formulario de login en cada test.
  10 |     const testEmail = 'argendeli01@gmail.com';
  11 |     const testPassword = 'sanrafael360_test';
  12 |     
  13 |     await page.fill('input[type="email"]', testEmail);
  14 |     await page.fill('input[type="password"]', testPassword);
  15 |     await page.click('button[type="submit"]');
  16 |     
  17 |     // Esperar a que la URL cambie (ya sea al portal o al home)
  18 |     await page.waitForURL(url => url.pathname === '/portal' || url.pathname === '/', { timeout: 15000 });
  19 |     
  20 |     if (!page.url().includes('/portal')) {
  21 |       await page.goto('/portal', { waitUntil: 'networkidle' });
  22 |     }
  23 |     await page.waitForLoadState('load');
  24 |   });
  25 | 
  26 |   test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
  27 |     // 2. Ir a un negocio que sepamos que existe
  28 |     await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
  29 |     
  30 |     // 3. Abrir Modal de Reclamo si está disponible
  31 |     const claimButton = page.getByRole('button', { name: 'Reclamar Perfil' });
  32 |     
  33 |     if (await claimButton.isVisible()) {
  34 |       await claimButton.click();
  35 |       
  36 |       // 4. Intentar enviar sin archivo (con mensaje)
  37 |       await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
  38 |       await page.click('button:has-text("Enviar Solicitud")');
  39 |       
  40 |       // 5. Verificar mensaje de error de frontend (AHORA ES MANDATORIO)
  41 |       await expect(page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')).toBeVisible();
  42 |       
  43 |       // 6. Adjuntar un archivo de prueba
  44 |       await page.setInputFiles('input[id="claim-file-upload"]', {
  45 |         name: 'doc-prueba.txt',
  46 |         mimeType: 'text/plain',
  47 |         buffer: Buffer.from('Documento de validación de propiedad.'),
  48 |       });
  49 |       
  50 |       // 7. Enviar de nuevo
  51 |       // Manejamos el alert nativo que lanza el frontend
  52 |       page.once('dialog', dialog => dialog.accept());
  53 |       await page.click('button:has-text("Enviar Solicitud")');
  54 |       
  55 |       // 8. Verificar que el estado cambie a "Pendiente"
> 56 |       await expect(page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')).toBeVisible();
     |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  57 |     }
  58 |   });
  59 | 
  60 |   test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
  61 |     await page.goto('/portal/admin');
  62 |     // Verificamos el componente de Acceso Restringido
  63 |     await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible({ timeout: 15000 });
  64 |   });
  65 | });
  66 | 
```