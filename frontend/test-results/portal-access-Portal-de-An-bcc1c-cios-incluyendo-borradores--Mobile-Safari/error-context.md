# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-access.spec.ts >> Portal de Anunciante >> un usuario autenticado debe ver sus negocios (incluyendo borradores)
- Location: tests/portal-access.spec.ts:11:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/portal" until "load"
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
> 25 |     await page.waitForURL('/portal');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  26 | 
  27 |     // 4. Interceptar la llamada a la API /me para verificar el Status
  28 |     const responsePromise = page.waitForResponse(response => 
  29 |       response.url().includes('/api/negocios/me') && response.status() === 200
  30 |     );
  31 | 
  32 |     // 5. Verificar que el portal cargue la lista
  33 |     await page.waitForSelector('h1:has-text("Portal de Anunciante")');
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