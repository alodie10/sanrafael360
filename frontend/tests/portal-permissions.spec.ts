import { test, expect } from '@playwright/test';

test.describe('Seguridad del Portal', () => {

  test('debe cargar el portal para un usuario autenticado válido', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('portal-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Acceso denegado')).not.toBeVisible();
    console.log('✅ Portal cargó correctamente — sesión válida verificada via UI.');
  });

  test('un usuario no admin debe ser redirigido desde /portal/admin', async ({ page }) => {
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });
    await page.waitForURL('**/portal', { timeout: 15000 });
    await expect(page.getByTestId('portal-title')).toBeVisible();
  });
});
