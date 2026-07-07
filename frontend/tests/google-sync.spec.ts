import { test, expect } from '@playwright/test';

test.describe('Google Maps Synchronization E2E', () => {
  test('should sync business hours from Google Maps', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

    await page.goto(`${baseUrl}/portal`);
    const editButton = page.getByRole('link', { name: 'Editar' }).or(page.getByText('Editar')).first();

    if (!(await editButton.isVisible())) {
      test.skip(true, 'Usuario de test sin negocios editables.');
      return;
    }

    await editButton.click();
    await expect(page).toHaveURL(/.*editar/);

    const syncButton = page.locator('text=Importar desde Google');
    if (!(await syncButton.isVisible())) {
      test.skip(true, 'Botón de importación Google no disponible en este negocio.');
      return;
    }

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/discovery/google') && res.status() === 200,
        { timeout: 30000 }
      ),
      syncButton.click(),
    ]);

    await expect(page.locator('text=Horarios importados correctamente')).toBeVisible({ timeout: 20000 });
  });

  test('should not have 500 errors in activities list', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

    page.on('response', (response) => {
      if (response.url().includes('/api/actividades') && response.status() >= 500) {
        throw new Error(`API Error 500 detected on activities: ${response.url()}`);
      }
    });

    await page.goto(`${baseUrl}/portal`);
    await expect(page.getByTestId('portal-title')).toBeVisible();
    await page.waitForTimeout(2000);
  });
});
