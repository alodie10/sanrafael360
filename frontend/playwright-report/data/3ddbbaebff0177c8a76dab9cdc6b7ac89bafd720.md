# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-access.spec.ts >> Portal de Anunciante >> un usuario autenticado debe ver sus negocios (incluyendo borradores)
- Location: tests/portal-access.spec.ts:11:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
    - generic [ref=e14]:
      - heading "Iniciar Sesión" [level=1] [ref=e15]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Email
          - textbox [active] [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Contraseña
          - textbox [ref=e22]: sanrafael360_test
        - button "Entrar" [ref=e23] [cursor=pointer]
      - paragraph [ref=e24]:
        - text: ¿No tienes cuenta?
        - link "Regístrate" [ref=e25]:
          - /url: /registro
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e37]
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
> 25 |     await page.waitForURL(url => url.pathname === '/portal' || url.pathname === '/', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  26 |     
  27 |     // Si no estamos en el portal, vamos manualmente
  28 |     if (!page.url().includes('/portal')) {
  29 |         await page.goto('/portal', { waitUntil: 'networkidle' });
  30 |     }
  31 | 
  32 |     // 4. Interceptar la llamada a la API /me para verificar el Status
  33 |     const responsePromise = page.waitForResponse(response => 
  34 |       response.url().includes('/api/negocios/me')
  35 |     , { timeout: 30000 });
  36 | 
  37 |     // 5. Verificar que el portal cargue la lista (Título actualizado en la UI)
  38 |     await page.waitForSelector('h1:has-text("Mi Propiedad")');
  39 |     
  40 |     // Esperamos a que la petición de la API termine con éxito
  41 |     const response = await responsePromise;
  42 |     expect(response.status()).toBe(200);
  43 | 
  44 |     // 6. Verificar que aparezca un negocio en la lista
  45 |     // Buscamos cualquier elemento que represente un negocio (ej: el nombre o el badge de estado)
  46 |     const emptyState = await page.getByText('Aún no tienes negocios').isVisible();
  47 |     
  48 |     if (!emptyState) {
  49 |       console.log('✅ Negocios encontrados en el portal.');
  50 |       // Si hay negocios, verificamos que el layout de la tarjeta esté presente
  51 |       // Usamos un selector más flexible que coincida con el nuevo diseño
  52 |       await expect(page.locator('.rounded-\\[2\\.5rem\\]').first()).toBeVisible();
  53 |     } else {
  54 |       console.log('⚠️ El usuario no tiene negocios vinculados todavía.');
  55 |     }
  56 |   });
  57 | 
  58 |   test('no debe permitir acceso al portal a usuarios anónimos', async ({ page }) => {
  59 |     await page.goto('/portal');
  60 |     // Debe redirigir al login
  61 |     await page.waitForURL(url => url.pathname === '/login', { timeout: 15000 });
  62 |     await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
  63 |   });
  64 | });
  65 | 
```