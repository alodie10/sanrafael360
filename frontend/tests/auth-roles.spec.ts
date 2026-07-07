import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación y Roles', () => {
  test('registro por email está deshabilitado (solo Google OAuth)', async () => {
    test.skip(true, 'Flujo migrado a Google; ver tests @auth con PLAYWRIGHT_TEST=1.');
  });

  test('middleware debe proteger rutas de dashboard', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL('**/login*');
    await expect(page).toHaveURL(/.*login/);
  });
});
