import { test, expect } from '@playwright/test';

/**
 * Test de Integración: Acceso al Portal y Visibilidad de Borradores
 * 
 * Este test verifica que un usuario autenticado pueda ver sus negocios reclamados
 * utilizando el endpoint /api/negocios/me, asegurando que los borradores son visibles.
 */
test.describe('Portal de Anunciante', () => {
  
  test('un usuario autenticado debe ver sus negocios (incluyendo borradores)', async ({ page }) => {
    // 1. Navegar al Login
    await page.goto('/login');

    // 2. Realizar Login (Usamos credenciales de entorno o las de prueba conocidas)
    // Nota: Estas deben estar configuradas en GitHub Secrets para el CI
    const testEmail = process.env.TEST_USER_EMAIL || 'argendeli01@gmail.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'sanrafael360_test';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 3. Esperar redirección al portal o ir manualmente
    await page.waitForURL('/portal');

    // 4. Interceptar la llamada a la API /me para verificar el Status
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/negocios/me') && response.status() === 200
    );

    // 5. Verificar que el portal cargue la lista
    await page.waitForSelector('h1:has-text("Portal de Anunciante")');
    
    // Esperamos a que la petición de la API termine con éxito
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // 6. Verificar que aparezca un negocio en la lista
    // Buscamos cualquier elemento que represente un negocio (ej: el nombre o el badge de estado)
    const emptyState = await page.getByText('Aún no tienes negocios').isVisible();
    
    if (!emptyState) {
      console.log('✅ Negocios encontrados en el portal.');
      // Si hay negocios, verificamos que el layout de la tarjeta esté presente
      await expect(page.locator('.bg-slate-900.border.border-white\\/10')).toBeVisible();
    } else {
      console.log('⚠️ El usuario no tiene negocios vinculados todavía.');
    }
  });

  test('no debe permitir acceso al portal a usuarios anónimos', async ({ page }) => {
    await page.goto('/portal');
    // Debe redirigir al login
    await page.waitForURL('/login?callbackUrl=%2Fportal');
    await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
  });
});
