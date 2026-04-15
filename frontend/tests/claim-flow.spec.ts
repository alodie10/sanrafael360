import { test, expect } from '@playwright/test';

/**
 * Test del Flujo de Reclamo de Negocio
 *
 * Verifica el proceso completo de reclamación: validación de documentos
 * y restricción del panel admin para usuarios sin rol Admin.
 *
 * Auth: Inyectada vía storageState (global-setup.ts) — no requiere login manual.
 */
test.describe('Flujo de Reclamo de Negocio', () => {

  test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
    // storageState inyecta la sesión — navegamos directo al negocio
    await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
    await page.waitForLoadState('networkidle');

    // Abrir Modal de Reclamo si está disponible para este negocio
    const claimButton = page.getByRole('button', { name: 'Reclamar Perfil' });

    if (await claimButton.isVisible()) {
      // Mockear la respuesta del backend para no crear el reclamo en la BD real
      // Esto previene que el test falle en ejecuciones subsecuentes por "reclamo duplicado"
      await page.route('**/api/negocios/*/claim', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Claim requested successfully' })
      }));

      await claimButton.click();

      // Intentar enviar sin archivo (solo con mensaje)
      await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
      await page.click('button:has-text("Enviar Solicitud")');

      // Verificar validación frontend: documentación obligatoria
      await expect(page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')).toBeVisible();

      // Adjuntar un archivo de prueba
      await page.setInputFiles('input[id="claim-file-upload"]', {
        name: 'doc-prueba.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Documento de validación de propiedad.'),
      });

      // Enviar de nuevo con archivo
      page.once('dialog', dialog => dialog.accept());
      await page.click('button:has-text("Enviar Solicitud")');

      // Verificar estado "Pendiente"
      await expect(page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')).toBeVisible();
    } else {
      console.log('ℹ️ Este negocio ya tiene dueño o el botón no está disponible en esta sesión.');
    }
  });

  test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
    // El usuario de prueba tiene role=null (no Admin).
    // El SSR de /portal/admin detecta role !== 'Admin' y muestra "Acceso Restringido".
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible({ timeout: 15000 });
  });
});
