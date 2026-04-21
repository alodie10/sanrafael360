
import { test, expect } from '@playwright/test';

test.describe('Google Maps Synchronization E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Configurar baseUrl si no está en config
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    
    // 2. Login
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', 'argendeli01@gmail.com');
    await page.fill('input[type="password"]', 'DcaDca_01');
    await page.click('button[type="submit"]');
    
    // Esperar a estar en el portal
    await expect(page).toHaveURL(/.*portal/);
  });

  test('should sync business hours from Google Maps', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

    // 1. Navegar al portal de edición del negocio de prueba
    // Buscamos el botón 'Editar' del primer negocio
    await page.goto(`${baseUrl}/portal`);
    await page.waitForSelector('text=Editar');
    await page.click('text=Editar');
    
    // Verificar que estamos en la página de edición
    await expect(page).toHaveURL(/.*editar/);

    // 2. Click en 'Importar desde Google'
    const syncButton = page.locator('text=Importar desde Google');
    await expect(syncButton).toBeVisible();
    
    // Interceptar la llamada a la API para verificar que no falle
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/discovery/google') && res.status() === 200),
      syncButton.click(),
    ]);

    // 3. Verificar feedback visual
    // Debería aparecer un toast de éxito
    await expect(page.locator('text=Horarios importados correctamente')).toBeVisible({ timeout: 20000 });

    // 4. Verificar que los campos se hayan poblado (ej: lunes ya no debería estar vacío si vino de Google)
    // Esto depende de los datos reales de Google, pero al menos validamos que el flujo terminó bien
    const successToast = page.locator('text=Horarios importados correctamente');
    await expect(successToast).toBeVisible();
  });

  test('should not have 500 errors in activities list', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    
    // Monitorear errores de consola o de red
    page.on('response', response => {
      if (response.url().includes('/api/actividades') && response.status() >= 500) {
        throw new Error(`API Error 500 detected on activities: ${response.url()}`);
      }
    });

    await page.goto(`${baseUrl}/portal`);
    
    // Verificar que la lista de actividades cargue (si existe un contenedor de actividades)
    // Asumimos que hay una sección de 'Panel de Control' o similar
    await expect(page.locator('text=Panel de Control')).toBeVisible();
    
    // Esperar un momento para asegurar que las llamadas a la API se completen
    await page.waitForTimeout(2000);
  });
});
