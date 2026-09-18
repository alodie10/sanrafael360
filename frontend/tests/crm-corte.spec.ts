import { test, expect } from '@playwright/test';
import { requireAdminTestCredentials } from './test-env';

test.describe('CRM paralelo — nav de captación intacto', () => {
  test('las 4 pestañas siguen y el CRM convive al lado', async ({ page }) => {
    let admin: { email: string; password: string };
    try {
      admin = requireAdminTestCredentials();
    } catch {
      test.skip(true, 'Sin TEST_ADMIN_* / TEST_USER_* para el nav CRM.');
      return;
    }

    await page.goto('/login');
    await page.getByTestId('login-email').fill(admin.email);
    await page.getByTestId('login-password').fill(admin.password);
    await page.getByTestId('login-submit').click();
    await page.waitForURL((url) => url.pathname.startsWith('/portal'), { timeout: 20000 });
    await page.goto('/portal/admin', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('admin-crm-nav')).toBeVisible();
    await expect(page.getByTestId('admin-leads-nav')).toBeVisible();
    await expect(page.getByTestId('admin-alta-negocio-nav')).toBeVisible();
    await expect(page.getByTestId('admin-discovery-nav')).toBeVisible();
    await expect(page.getByTestId('admin-prospeccion-nav')).toBeVisible();
  });
});
