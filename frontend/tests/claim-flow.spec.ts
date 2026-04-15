import { test, expect } from '@playwright/test';

test.describe('Flujo de Reclamo de Negocio', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Iniciar sesión con usuario de prueba
    await page.goto('/login');
    // Nota: El sistema usa NextAuth. Playwright requiere manejar el estado de autenticación.
    // Para simplificar, llenamos el formulario de login en cada test.
    const testEmail = 'argendeli01@gmail.com';
    const testPassword = 'sanrafael360_test';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Esperar a que la URL cambie (ya sea al portal o al home)
    await page.waitForURL(url => url.pathname === '/portal' || url.pathname === '/', { timeout: 15000 });
    
    if (!page.url().includes('/portal')) {
      await page.goto('/portal', { waitUntil: 'networkidle' });
    }
    await page.waitForLoadState('load');
  });

  test('debe exigir documentación mandatoria para reclamar un negocio', async ({ page }) => {
    // 2. Ir a un negocio que sepamos que existe
    await page.goto('/negocios/apart-hotel-ayum-elun-aldea-de-rio-valle-grande');
    
    // 3. Abrir Modal de Reclamo si está disponible
    const claimButton = page.getByRole('button', { name: 'Reclamar Perfil' });
    
    if (await claimButton.isVisible()) {
      await claimButton.click();
      
      // 4. Intentar enviar sin archivo (con mensaje)
      await page.fill('textarea[placeholder*="Hola, soy el dueño"]', 'Prueba de reclamo mandatorio');
      await page.click('button:has-text("Enviar Solicitud")');
      
      // 5. Verificar mensaje de error de frontend (AHORA ES MANDATORIO)
      await expect(page.getByText('La documentación probatoria (DNI o Habilitación) es obligatoria.')).toBeVisible();
      
      // 6. Adjuntar un archivo de prueba
      await page.setInputFiles('input[id="claim-file-upload"]', {
        name: 'doc-prueba.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Documento de validación de propiedad.'),
      });
      
      // 7. Enviar de nuevo
      // Manejamos el alert nativo que lanza el frontend
      page.once('dialog', dialog => dialog.accept());
      await page.click('button:has-text("Enviar Solicitud")');
      
      // 8. Verificar que el estado cambie a "Pendiente"
      await expect(page.getByText('Tu solicitud de reclamo está pendiente de aprobación.')).toBeVisible();
    }
  });

  test('un usuario no admin no debe poder entrar al panel /portal/admin', async ({ page }) => {
    await page.goto('/portal/admin');
    // Verificamos el componente de Acceso Restringido
    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible({ timeout: 15000 });
  });
});
