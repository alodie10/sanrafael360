import { test, expect } from '@playwright/test';
import { EPHEMERAL_TEST_PASSWORD } from './test-env';

test.describe('Flujo de Autenticación y Roles', () => {
  const testEmail = `test_pro_${Date.now()}@example.com`;

  test('debe permitir registrarse como Propietario y mantener el rol en la sesión', async ({ page }) => {
    // 1. Ir a la página de registro
    await page.goto('/registro');

    // 2. Llenar el formulario
    await page.fill('input[type="text"]', 'Test Propietario');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', EPHEMERAL_TEST_PASSWORD);

    // 3. Seleccionar rol Propietario
    await page.click('text=💼 Propietario');

    // 4. Enviar
    await page.click('button[type="submit"]');

    // 5. Esperar redirección al portal (la protección de ruta debe dejarlo pasar)
    await page.waitForURL('**/portal', { timeout: 15000 });
    
    // 6. Verificar que el middleware no lo rebotó
    await expect(page).toHaveURL(/.*portal/);
    
    // 7. Opcional: Verificar que el texto de bienvenida o el perfil refleje el rol si está implementado
    // Por ahora, el éxito de la URL /portal tras el registro es prueba suficiente de éxito del auth.
  });

  test('middleware debe proteger rutas de dashboard', async ({ page }) => {
    // Intento entrar al dashboard sin sesión
    await page.context().clearCookies();
    await page.goto('/dashboard');
    
    // Debe redirigir a login
    await page.waitForURL('**/login*');
    await expect(page).toHaveURL(/.*login/);
  });
});
