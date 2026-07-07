import { test, expect } from '@playwright/test';

test.describe('Flujo de Reclamo de Negocio', () => {

  test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
    await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
    await page.waitForLoadState('networkidle');

    const claimButton = page.getByTestId('claim-profile-button');

    if (await claimButton.isVisible()) {
      await page.route('**/api/negocios/*/claim', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Claim requested successfully' }),
        })
      );

      await claimButton.click();
      await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
      await page.click('button:has-text("Enviar Solicitud")');

      await expect(
        page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')
      ).toBeVisible();

      await page.setInputFiles('input[id="claim-file-upload"]', {
        name: 'doc-prueba.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Documento de validación de propiedad.'),
      });

      page.once('dialog', (dialog) => dialog.accept());
      await page.click('button:has-text("Enviar Solicitud")');

      await expect(
        page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')
      ).toBeVisible();
    } else {
      console.log('ℹ️ Este negocio ya tiene dueño o el botón no está disponible en esta sesión.');
    }
  });

  test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });
    await page.waitForURL('**/portal', { timeout: 15000 });
    await expect(page.getByTestId('portal-title')).toBeVisible();
  });
});
