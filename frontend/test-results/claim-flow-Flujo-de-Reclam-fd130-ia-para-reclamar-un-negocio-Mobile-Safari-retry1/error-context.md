# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: claim-flow.spec.ts >> Flujo de Reclamo de Negocio >> debe exigir documentación mandatoria para reclamar un negocio
- Location: tests/claim-flow.spec.ts:21:7

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
            - generic [ref=e114]:
              - generic:
                - button "Combinaciones de teclas"
              - region "Mapa" [ref=e115]
              - generic [ref=e116]:
                - generic [ref=e134]:
                  - generic:
                    - generic:
                      - generic:
                        - img "Apart Hotel Ayum Elun Aldea de Río - Valle Grande"
                - iframe [ref=e136]:
                  
                - generic:
                  - generic:
                    - button "Controles de visualización del mapa" [ref=e138] [cursor=pointer]
                    - button "Arrastra al hombrecito al mapa para abrir Street View" [ref=e139] [cursor=pointer]:
                      - generic:
                        - img "Control del hombrecito de Street View"
                    - generic [ref=e141] [cursor=pointer]:
                      - button "Ampliar" [ref=e142]
                      - button "Reducir" [ref=e144]
                - link "Abre esta zona en Google Maps (se abre en una nueva ventana)" [ref=e146]:
                  - /url: https://maps.google.com/maps?ll=-34.820716,-68.447587&z=15&t=m&hl=es&gl=US&mapclient=apiv3
                  - img "Google" [ref=e148]
                - generic [ref=e149]:
                  - button "Combinaciones de teclas" [ref=e155] [cursor=pointer]
                  - generic [ref=e160]: Datos del mapa ©2026
                  - link "Términos (se abre en una nueva pestaña)" [ref=e165] [cursor=pointer]:
                    - /url: https://www.google.com/intl/es_US/help/terms_maps.html
                    - text: Términos
      - generic [ref=e167]:
        - button "✕" [ref=e168] [cursor=pointer]
        - heading "Reclamar Negocio" [level=3] [ref=e169]
        - paragraph [ref=e170]:
          - text: Estás a un paso de tomar control de
          - strong [ref=e171]: Apart Hotel Ayum Elun Aldea de Río - Valle Grande
          - text: . Déjanos un mensaje con tu número de teléfono o una forma de validar que eres el dueño o representante legal.
        - 'textbox "Ej: Hola, soy el dueño de este local. Mi teléfono es 2604-XXXXXX." [ref=e172]': Prueba de reclamo mandatorio
        - generic [ref=e173]:
          - generic [ref=e174]: Documentación de propiedad (Obligatorio - PDF/ID)
          - generic [ref=e175]:
            - generic [ref=e176] [cursor=pointer]:
              - generic [ref=e177]: doc-prueba.txt
              - generic [ref=e178]: Subir
            - button "✕" [ref=e179] [cursor=pointer]
          - paragraph [ref=e180]: Adjunta una copia de tu inscripción fiscal, DNI o cualquier documento que acredite la propiedad.
        - generic [ref=e181]: El negocio ya tiene un reclamo en proceso o asignado a un propietario
        - generic [ref=e182]:
          - button "Cancelar" [ref=e183] [cursor=pointer]
          - button "Enviar Solicitud" [ref=e184] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e190] [cursor=pointer]:
    - img [ref=e191]
  - alert [ref=e196]
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
  17 |     // Esperar a estar en el portal
  18 |     await page.waitForURL('/portal');
  19 |   });
  20 | 
  21 |   test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
  22 |     // 2. Ir a un negocio que sepamos que existe
  23 |     await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
  24 |     
  25 |     // 3. Abrir Modal de Reclamo si está disponible
  26 |     const claimButton = page.getByRole('button', { name: 'Reclamar Perfil' });
  27 |     
  28 |     if (await claimButton.isVisible()) {
  29 |       await claimButton.click();
  30 |       
  31 |       // 4. Intentar enviar sin archivo (con mensaje)
  32 |       await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
  33 |       await page.click('button:has-text("Enviar Solicitud")');
  34 |       
  35 |       // 5. Verificar mensaje de error de frontend (AHORA ES MANDATORIO)
  36 |       await expect(page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')).toBeVisible();
  37 |       
  38 |       // 6. Adjuntar un archivo de prueba
  39 |       await page.setInputFiles('input[id="claim-file-upload"]', {
  40 |         name: 'doc-prueba.txt',
  41 |         mimeType: 'text/plain',
  42 |         buffer: Buffer.from('Documento de validación de propiedad.'),
  43 |       });
  44 |       
  45 |       // 7. Enviar de nuevo
  46 |       // Manejamos el alert nativo que lanza el frontend
  47 |       page.once('dialog', dialog => dialog.accept());
  48 |       await page.click('button:has-text("Enviar Solicitud")');
  49 |       
  50 |       // 8. Verificar que el estado cambie a "Pendiente"
> 51 |       await expect(page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')).toBeVisible();
     |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  52 |     }
  53 |   });
  54 | 
  55 |   test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
  56 |     await page.goto('/portal/admin');
  57 |     // Verificamos el componente de Acceso Restringido que implementamos
  58 |     await expect(page.getByText('Acceso Restringido')).toBeVisible();
  59 |   });
  60 | });
  61 | 
```