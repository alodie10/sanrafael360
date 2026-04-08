import { test, expect } from '@playwright/test';

/**
 * Test de Seguimiento: Verificación de Permisos (Fix 403)
 * 
 * Este test valida que el endpoint /api/negocios/me no devuelva un 403
 * y que el UI del portal reaccione correctamente ante fallos de autorización.
 */
test.describe('Seguridad del Portal', () => {

  test('debe cargar la lista de negocios con status 200 para un usuario válido', async ({ page }) => {
    // 1. Simular Login
    await page.goto('/login');
    const testEmail = process.env.TEST_USER_EMAIL || 'argendeli01@gmail.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'sanrafael360_test';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 2. Ir al Portal
    await page.waitForURL('/portal');

    // 3. Capturar la respuesta de /me
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/negocios/me')),
      page.reload(), // Recargamos para ver la petición limpia
    ]);

    // 4. Verificación Crítica del 403
    console.log(`📡 Status de respuesta /me: ${response.status()}`);
    expect(response.status()).not.toBe(403);
    expect(response.status()).toBe(200);

    // 5. Verificar que no se muestre el mensaje de error de permisos
    await expect(page.locator('text=Acceso denegado')).not.toBeVisible();
  });

  test('debe mostrar mensaje de error amigable si el servidor responde 403 (Simulado)', async ({ page }) => {
    // Bloqueamos la petición real y forzamos un 403 para testear la UX
    await page.route('**/api/negocios/me', route => route.fulfill({
      status: 403,
      body: JSON.stringify({ error: 'Forbidden' }),
    }));

    // Forzar login (o acceso directo si ya hay sesión, pero aquí simulamos)
    await page.goto('/portal');

    // Verificar que aparezca el UI de error que implementamos
    await expect(page.locator('text=Acceso denegado')).toBeVisible();
    await expect(page.locator('text=Hubo un problema')).toBeVisible();
  });
});
