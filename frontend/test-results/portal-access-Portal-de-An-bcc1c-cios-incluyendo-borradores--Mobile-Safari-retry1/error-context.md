# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-access.spec.ts >> Portal de Anunciante >> un usuario autenticado debe ver sus negocios (incluyendo borradores)
- Location: tests/portal-access.spec.ts:11:7

# Error details

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
```

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('h1:has-text("Portal de Anunciante")') to be visible

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
  4  |  * Test de Integración: Acceso al Portal y Visibilidad de Borradores
  5  |  * 
  6  |  * Este test verifica que un usuario autenticado pueda ver sus negocios reclamados
  7  |  * utilizando el endpoint /api/negocios/me, asegurando que los borradores son visibles.
  8  |  */
  9  | test.describe('Portal de Anunciante', () => {
  10 |   
  11 |   test('un usuario autenticado debe ver sus negocios (incluyendo borradores)', async ({ page }) => {
  12 |     // 1. Navegar al Login
  13 |     await page.goto('/login');
  14 | 
  15 |     // 2. Realizar Login (Usamos credenciales de entorno o las de prueba conocidas)
  16 |     // Nota: Estas deben estar configuradas en GitHub Secrets para el CI
  17 |     const testEmail = process.env.TEST_USER_EMAIL || 'argendeli01@gmail.com';
  18 |     const testPassword = process.env.TEST_USER_PASSWORD || 'sanrafael360_test';
  19 | 
  20 |     await page.fill('input[type="email"]', testEmail);
  21 |     await page.fill('input[type="password"]', testPassword);
  22 |     await page.click('button[type="submit"]');
  23 | 
  24 |     // 3. Esperar redirección al portal o ir manualmente
  25 |     await page.waitForURL('/portal');
  26 | 
  27 |     // 4. Interceptar la llamada a la API /me para verificar el Status
  28 |     const responsePromise = page.waitForResponse(response => 
  29 |       response.url().includes('/api/negocios/me') && response.status() === 200
  30 |     );
  31 | 
  32 |     // 5. Verificar que el portal cargue la lista
> 33 |     await page.waitForSelector('h1:has-text("Portal de Anunciante")');
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  34 |     
  35 |     // Esperamos a que la petición de la API termine con éxito
  36 |     const response = await responsePromise;
  37 |     expect(response.status()).toBe(200);
  38 | 
  39 |     // 6. Verificar que aparezca un negocio en la lista
  40 |     // Buscamos cualquier elemento que represente un negocio (ej: el nombre o el badge de estado)
  41 |     const emptyState = await page.getByText('Aún no tienes negocios').isVisible();
  42 |     
  43 |     if (!emptyState) {
  44 |       console.log('✅ Negocios encontrados en el portal.');
  45 |       // Si hay negocios, verificamos que el layout de la tarjeta esté presente
  46 |       await expect(page.locator('.bg-slate-900.border.border-white\\/10')).toBeVisible();
  47 |     } else {
  48 |       console.log('⚠️ El usuario no tiene negocios vinculados todavía.');
  49 |     }
  50 |   });
  51 | 
  52 |   test('no debe permitir acceso al portal a usuarios anónimos', async ({ page }) => {
  53 |     await page.goto('/portal');
  54 |     // Debe redirigir al login
  55 |     await page.waitForURL('/login?callbackUrl=%2Fportal');
  56 |     await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
  57 |   });
  58 | });
  59 | 
```