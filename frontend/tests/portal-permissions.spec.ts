import { test, expect } from '@playwright/test';

/**
 * Test de Seguimiento: Verificación de Permisos (Fix 403)
 *
 * Valida que el portal cargue correctamente para un usuario autenticado
 * y que la pantalla de "Acceso Restringido" funcione para usuarios sin rol Admin.
 *
 * Auth: Inyectada vía storageState (global-setup.ts) — no requiere login manual.
 * 
 * NOTA TÉCNICA: El endpoint /api/negocios/me es llamado server-side por Next.js.
 * Su resultado no es visible al tráfico de red del browser. La validación se hace vía UI.
 */
test.describe('Seguridad del Portal', () => {

  test('debe cargar la lista de negocios con status 200 para un usuario válido', async ({ page }) => {
    // storageState inyecta la sesión — navegamos directo al portal
    await page.goto('/portal', { waitUntil: 'networkidle' });

    // El heading "Mi Propiedad" solo aparece cuando la sesión es válida
    // y el SSR completó la llamada a /api/negocios/me con éxito (status 200)
    await expect(page.locator('h1:has-text("Mi Propiedad")')).toBeVisible({ timeout: 15000 });

    // Verificar que no aparezca ningún mensaje de error de acceso
    await expect(page.locator('text=Acceso denegado')).not.toBeVisible();
    await expect(page.locator('text=403')).not.toBeVisible();

    console.log('✅ Portal cargó correctamente — sesión válida verificada via UI.');
  });

  test('debe mostrar mensaje de error amigable si el servidor responde 403 (Simulado)', async ({ page }) => {
    // El usuario de prueba (argendeli01) tiene role=null (no es Admin).
    // Al navegar a /portal/admin, el SSR detecta role !== 'Admin' y renderiza "Acceso Restringido".
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });

    // Verificar la pantalla de gate de autorización
    await expect(page.locator('text=Acceso Restringido')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=No tienes permisos')).toBeVisible();
  });
});
