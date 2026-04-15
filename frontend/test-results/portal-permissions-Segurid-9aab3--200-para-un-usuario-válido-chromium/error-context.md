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
          - generic [ref=e18]:
            - link "Portal" [ref=e19] [cursor=pointer]:
              - /url: /portal
              - img [ref=e20]
              - text: Portal
            - button "Cerrar Sesión" [ref=e23] [cursor=pointer]:
              - img [ref=e24]
          - link "Vende aquí" [ref=e27] [cursor=pointer]:
            - /url: /contacto
            - img [ref=e28]
            - text: Vende aquí
    - generic [ref=e29]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - img [ref=e34]
          - generic [ref=e39]:
            - heading "Mi Propiedad" [level=1] [ref=e40]
            - paragraph [ref=e41]: Centro de Control • San Rafael 360
        - generic [ref=e43]:
          - generic [ref=e44]: D
          - generic [ref=e45]:
            - paragraph [ref=e46]: Autenticado
            - paragraph [ref=e47]: Diego Argendeli
      - main [ref=e48]:
        - generic [ref=e49]:
          - heading "Mis Negocios" [level=2] [ref=e50]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - img "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [ref=e54]
              - generic [ref=e59]: Activo
              - img "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [ref=e61]
            - generic [ref=e62]:
              - heading "LA COCINA DE PETTRA (Resto) - Ciudad - (1)" [level=3] [ref=e63]
              - generic [ref=e64]:
                - img [ref=e65]
                - generic [ref=e68]: Gastronomía
              - generic [ref=e69]:
                - link "Perfil" [ref=e70] [cursor=pointer]:
                  - /url: /negocios/la-cocina-de-pettra-resto-ciudad-1
                  - img [ref=e71]
                  - text: Perfil
                - link "Gestionar" [ref=e75] [cursor=pointer]:
                  - /url: /portal/negocios/a8nvon6bztgvna10hpyykt7r/editar
        - generic [ref=e76]:
          - generic [ref=e77]:
            - generic [ref=e78]:
              - heading "¿Necesitas ayuda adicional?" [level=2] [ref=e79]
              - paragraph [ref=e80]: Si encuentras algún problema técnico o necesitas realizar un cambio en campos protegidos (como el nombre de tu negocio o categoría), envíanos un mensaje.
            - generic [ref=e81]:
              - generic [ref=e82]:
                - paragraph [ref=e83]: Dudas inmediatas
                - link "WhatsApp Admin" [ref=e84] [cursor=pointer]:
                  - /url: https://wa.me/5492604000000
                  - img [ref=e86]
                  - text: WhatsApp Admin
              - generic [ref=e88]:
                - paragraph [ref=e89]: Estado de atención
                - generic [ref=e90]:
                  - img [ref=e92]
                  - paragraph [ref=e95]: Online
          - generic [ref=e96]:
            - generic [ref=e97]:
              - img [ref=e99]
              - generic [ref=e101]:
                - heading "Centro de Ayuda" [level=2] [ref=e102]
                - paragraph [ref=e103]: Asistencia Personalizada
            - generic [ref=e104]:
              - generic [ref=e105]:
                - text: Asunto de la consulta
                - 'textbox "Ej: Solicitud de cambio de categoría" [ref=e106]'
              - generic [ref=e107]:
                - text: Mensaje Detallado
                - textbox "Describe aquí tu consulta o el cambio específico que necesitas..." [ref=e108]
              - button "Enviar Solicitud" [ref=e109] [cursor=pointer]:
                - img [ref=e110]
                - text: Enviar Solicitud
  - button "Open Next.js Dev Tools" [ref=e118] [cursor=pointer]:
    - img [ref=e119]
  - alert [ref=e122]
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