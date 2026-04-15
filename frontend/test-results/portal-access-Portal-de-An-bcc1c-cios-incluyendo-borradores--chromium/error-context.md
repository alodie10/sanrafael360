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