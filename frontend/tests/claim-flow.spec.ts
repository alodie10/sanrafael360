import { test, expect } from '@playwright/test';

test.describe('Flujo de Reclamo de Negocio', () => {

  test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
    await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
    await page.waitForLoadState('networkidle');

    const claimButton = page.getByTestId('claim-profile-button');

    if (!(await claimButton.isVisible())) {
      test.skip(true, 'Negocio ya reclamado o sin botón de reclamo en esta sesión.');
      return;
    }

    await page.route('**/api/negocios/*/claim', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Claim requested successfully' }),
      })
    );

    await claimButton.click();
    await expect(page.getByTestId('claim-modal')).toBeVisible();
    await page.getByTestId('claim-message').fill('Prueba de reclamo mandatorio');
    await page.getByTestId('claim-submit').click();

    await expect(page.getByTestId('claim-error')).toHaveText(
      'La documentación probatoria (DNI o Habilitación) es obligatoria.'
    );

    await page.setInputFiles('input[id="claim-file-upload"]', {
      name: 'doc-prueba.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Documento de validación de propiedad.'),
    });

    await page.getByTestId('claim-submit').click();

    await expect(page.getByTestId('claim-success')).toHaveText(
      'Tu solicitud de reclamo está pendiente de aprobación.'
    );
  });

  test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });
    await page.waitForURL('**/portal', { timeout: 15000 });
    await expect(page.getByTestId('portal-title')).toBeVisible();
  });
});
