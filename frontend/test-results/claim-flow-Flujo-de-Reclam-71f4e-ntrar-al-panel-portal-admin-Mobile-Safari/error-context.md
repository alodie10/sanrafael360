# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: claim-flow.spec.ts >> Flujo de Reclamo de Negocio >> un usuario no admin no debe poder entrar al panel /portal/admin
- Location: tests/claim-flow.spec.ts:63:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Acceso Restringido' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Acceso Restringido' })

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
    - generic [ref=e14]:
      - heading "Iniciar Sesión" [level=1] [ref=e15]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Email
          - textbox [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Contraseña
          - textbox [ref=e22]
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
  17 |     // Esperar a que la URL cambie (ya sea al portal, al home o se quede en login)
  18 |     try {
  19 |       await page.waitForURL(url => url.pathname === '/portal' || url.pathname === '/' || url.pathname.includes('/login'), { timeout: 10000 });
  20 |     } catch (e) {
  21 |       console.log("⚠️ Timeout waiting for redirect, attempting to go to /portal manually");
  22 |     }
  23 |     
  24 |     if (!page.url().includes('/portal')) {
  25 |       await page.goto('/portal');
  26 |     }
  27 |   });
  28 | 
  29 |   test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
  30 |     // 2. Ir a un negocio que sepamos que existe
  31 |     await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
  32 |     
  33 |     // 3. Abrir Modal de Reclamo si está disponible
  34 |     const claimButton = page.getByRole('button', { name: 'Reclamar Perfil' });
  35 |     
  36 |     if (await claimButton.isVisible()) {
  37 |       await claimButton.click();
  38 |       
  39 |       // 4. Intentar enviar sin archivo (con mensaje)
  40 |       await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
  41 |       await page.click('button:has-text("Enviar Solicitud")');
  42 |       
  43 |       // 5. Verificar mensaje de error de frontend (AHORA ES MANDATORIO)
  44 |       await expect(page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')).toBeVisible();
  45 |       
  46 |       // 6. Adjuntar un archivo de prueba
  47 |       await page.setInputFiles('input[id="claim-file-upload"]', {
  48 |         name: 'doc-prueba.txt',
  49 |         mimeType: 'text/plain',
  50 |         buffer: Buffer.from('Documento de validación de propiedad.'),
  51 |       });
  52 |       
  53 |       // 7. Enviar de nuevo
  54 |       // Manejamos el alert nativo que lanza el frontend
  55 |       page.once('dialog', dialog => dialog.accept());
  56 |       await page.click('button:has-text("Enviar Solicitud")');
  57 |       
  58 |       // 8. Verificar que el estado cambie a "Pendiente"
  59 |       await expect(page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')).toBeVisible();
  60 |     }
  61 |   });
  62 | 
  63 |   test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
  64 |     await page.goto('/portal/admin');
  65 |     // Verificamos el componente de Acceso Restringido
> 66 |     await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible({ timeout: 15000 });
     |                                                                             ^ Error: expect(locator).toBeVisible() failed
  67 |   });
  68 | });
  69 | 
```