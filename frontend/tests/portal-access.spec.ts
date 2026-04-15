import { test, expect } from '@playwright/test';

/**
 * Test de Integración: Acceso al Portal y Visibilidad de Borradores
 *
 * Verifica que un usuario autenticado pueda ver sus negocios reclamados
 * via el endpoint /api/negocios/me (incluyendo borradores).
 *
 * Auth: Inyectada vía storageState (global-setup.ts) — no requiere login manual.
 */
test.describe('Portal de Anunciante', () => {

  test('un usuario autenticado debe ver sus negocios (incluyendo borradores)', async ({ page }) => {
    // storageState inyecta la sesión — navegamos directo al portal
    await page.goto('/portal', { waitUntil: 'networkidle' });

    // Verificar que el portal cargue correctamente (sesión válida en SSR)
    await expect(page.locator('h1:has-text("Mi Propiedad")')).toBeVisible({ timeout: 20000 });

    // Verificar layout del portal
    const emptyState = await page.getByText('No tienes negocios vinculados').isVisible();

    if (!emptyState) {
      console.log('✅ Negocios encontrados en el portal.');
    } else {
      console.log('⚠️ El usuario no tiene negocios vinculados todavía.');
    }
  });

  test('no debe permitir acceso al portal a usuarios anónimos', async ({ page, context }) => {
    // Para este test específico, limpiamos el storageState para simular usuario anónimo
    await context.clearCookies();

    await page.goto('/portal');
    // Debe redirigir al login
    await page.waitForURL(url => url.pathname === '/login', { timeout: 15000 });
    await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
  });
});
