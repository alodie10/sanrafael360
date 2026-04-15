# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-permissions.spec.ts >> Seguridad del Portal >> debe mostrar mensaje de error amigable si el servidor responde 403 (Simulado)
- Location: tests/portal-permissions.spec.ts:39:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Acceso Restringido')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Acceso Restringido')

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
    - generic [ref=e22]:
      - heading "Iniciar Sesión" [level=1] [ref=e23]
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: Email
          - textbox [ref=e27]
        - generic [ref=e28]:
          - generic [ref=e29]: Contraseña
          - textbox [ref=e30]
        - button "Entrar" [ref=e31] [cursor=pointer]
      - paragraph [ref=e32]:
        - text: ¿No tienes cuenta?
        - link "Regístrate" [ref=e33] [cursor=pointer]:
          - /url: /registro
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
  - alert [ref=e43]
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
  26 |       page.waitForResponse(res => res.url().includes('/api/negocios/me')),
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
  49 |     // Verificar que aparezca el UI de error que implementamos (Acceso Restringido en /admin)
  50 |     await page.goto('/portal/admin');
> 51 |     await expect(page.locator('text=Acceso Restringido')).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  52 |     await expect(page.locator('text=No tienes permisos')).toBeVisible();
  53 |   });
  54 | });
  55 | 
```