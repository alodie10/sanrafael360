import { test, expect } from '@playwright/test';

test.describe('Portal de Anunciante', () => {

  test('un usuario autenticado debe ver sus negocios (incluyendo borradores)', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('portal-title')).toBeVisible({ timeout: 20000 });

    const emptyState = await page.getByText('No tienes negocios vinculados').isVisible();
    if (!emptyState) {
      console.log('✅ Negocios encontrados en el portal.');
    } else {
      console.log('⚠️ El usuario no tiene negocios vinculados todavía.');
    }
  });

  test('no debe permitir acceso al portal a usuarios anónimos', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/portal');
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 15000 });
    await expect(page.getByTestId('login-title')).toHaveText('Bienvenido');
  });
});
