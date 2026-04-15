# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-permissions.spec.ts >> Seguridad del Portal >> debe cargar la lista de negocios con status 200 para un usuario válido
- Location: tests/portal-permissions.spec.ts:11:7

# Error details

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
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
    - generic [ref=e16]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - img [ref=e21]
          - generic [ref=e26]:
            - heading "Mi Propiedad" [level=1] [ref=e27]
            - paragraph [ref=e28]: Centro de Control • San Rafael 360
        - generic [ref=e31]: D
      - main [ref=e32]:
        - generic [ref=e33]:
          - heading "Mis Negocios" [level=2] [ref=e34]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - img "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [ref=e38]
              - generic [ref=e43]: Activo
              - img "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [ref=e45]
            - generic [ref=e46]:
              - heading "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [level=3] [ref=e47]
              - generic [ref=e48]:
                - img [ref=e49]
                - generic [ref=e52]: Gastronomía
              - generic [ref=e53]:
                - link "Perfil" [ref=e54]:
                  - /url: /negocios/la-cocina-de-pettra-resto-ciudad-1
                  - img [ref=e55]
                  - text: Perfil
                - link "Gestionar" [ref=e59]:
                  - /url: /portal/negocios/a8nvon6bztgvna10hpyykt7r/editar
        - generic [ref=e60]:
          - generic [ref=e61]:
            - generic [ref=e62]:
              - heading "¿Necesitas ayuda adicional?" [level=2] [ref=e63]
              - paragraph [ref=e64]: Si encuentras algún problema técnico o necesitas realizar un cambio en campos protegidos (como el nombre de tu negocio o categoría), envíanos un mensaje.
            - generic [ref=e65]:
              - generic [ref=e66]:
                - paragraph [ref=e67]: Dudas inmediatas
                - link "WhatsApp Admin" [ref=e68]:
                  - /url: https://wa.me/5492604000000
                  - img [ref=e70]
                  - text: WhatsApp Admin
              - generic [ref=e72]:
                - paragraph [ref=e73]: Estado de atención
                - generic [ref=e74]:
                  - img [ref=e76]
                  - paragraph [ref=e79]: Online
          - generic [ref=e80]:
            - generic [ref=e81]:
              - img [ref=e83]
              - generic [ref=e85]:
                - heading "Centro de Ayuda" [level=2] [ref=e86]
                - paragraph [ref=e87]: Asistencia Personalizada
            - generic [ref=e88]:
              - generic [ref=e89]:
                - text: Asunto de la consulta
                - 'textbox "Ej: Solicitud de cambio de categoría" [ref=e90]'
              - generic [ref=e91]:
                - text: Mensaje Detallado
                - textbox "Describe aquí tu consulta o el cambio específico que necesitas..." [ref=e92]
              - button "Enviar Solicitud" [ref=e93] [cursor=pointer]:
                - img [ref=e94]
                - text: Enviar Solicitud
  - button "Open Next.js Dev Tools" [ref=e102] [cursor=pointer]:
    - img [ref=e103]
  - alert [ref=e108]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Test de Seguimiento: Verificación de Permisos (Fix 403)
  5  |  * 
  6  |  * Este test valida que el endpoint /api/negocios/me no devuelva un 403
  7  |  * y que el UI del portal reaccione correctamente ante fallos de autorización.
  8  |  */
  9  | test.describe('Seguridad del Portal', () => {
  10 | 
  11 |   test('debe cargar la lista de negocios con status 200 para un usuario válido', async ({ page }) => {
  12 |     // 1. Simular Login
  13 |     await page.goto('/login');
  14 |     const testEmail = process.env.TEST_USER_EMAIL || 'argendeli01@gmail.com';
  15 |     const testPassword = process.env.TEST_USER_PASSWORD || 'sanrafael360_test';
  16 | 
  17 |     await page.fill('input[type="email"]', testEmail);
  18 |     await page.fill('input[type="password"]', testPassword);
  19 |     await page.click('button[type="submit"]');
  20 | 
  21 |     // 2. Ir al Portal
  22 |     await page.waitForURL('/portal');
  23 | 
  24 |     // 3. Capturar la respuesta de /me
  25 |     const [response] = await Promise.all([
> 26 |       page.waitForResponse(res => res.url().includes('/api/negocios/me')),
     |            ^ TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
  27 |       page.reload(), // Recargamos para ver la petición limpia
  28 |     ]);
  29 | 
  30 |     // 4. Verificación Crítica del 403
  31 |     console.log(`📡 Status de respuesta /me: ${response.status()}`);
  32 |     expect(response.status()).not.toBe(403);
  33 |     expect(response.status()).toBe(200);
  34 | 
  35 |     // 5. Verificar que no se muestre el mensaje de error de permisos
  36 |     await expect(page.locator('text=Acceso denegado')).not.toBeVisible();
  37 |   });
  38 | 
  39 |   test('debe mostrar mensaje de error amigable si el servidor responde 403 (Simulado)', async ({ page }) => {
  40 |     // Bloqueamos la petición real y forzamos un 403 para testear la UX
  41 |     await page.route('**/api/negocios/me', route => route.fulfill({
  42 |       status: 403,
  43 |       body: JSON.stringify({ error: 'Forbidden' }),
  44 |     }));
  45 | 
  46 |     // Forzar login (o acceso directo si ya hay sesión, pero aquí simulamos)
  47 |     await page.goto('/portal');
  48 | 
  49 |     // Verificar que aparezca el UI de error que implementamos
  50 |     await expect(page.locator('text=Acceso denegado')).toBeVisible();
  51 |     await expect(page.locator('text=Hubo un problema')).toBeVisible();
  52 |   });
  53 | });
  54 | 
```