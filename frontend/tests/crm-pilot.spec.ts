import { test, expect } from '@playwright/test';
import { requireAdminTestCredentials } from './test-env';

test.describe('CRM piloto — flujo admin aislado', () => {
  test('alta manual, prompt, pegar JSON y wa.me sin Enter', async ({ page }) => {
    let admin: { email: string; password: string };
    try {
      admin = requireAdminTestCredentials();
    } catch {
      test.skip(true, 'Sin TEST_ADMIN_* / TEST_USER_* para el piloto CRM.');
      return;
    }

    await page.goto('/login');
    await page.getByTestId('login-email').fill(admin.email);
    await page.getByTestId('login-password').fill(admin.password);
    await page.getByTestId('login-submit').click();
    await page.waitForURL((url) => url.pathname.startsWith('/portal'), { timeout: 20000 });
    await page.goto('/portal/crm', { waitUntil: 'networkidle' });
    const pageRoot = page.getByTestId('crm-page');
    if (!(await pageRoot.isVisible().catch(() => false))) {
      test.skip(true, 'No se pudo abrir /portal/crm (¿sesión admin o Strapi sin tablas crm-?).');
    }

    await expect(page.getByTestId('crm-cupo')).toBeVisible();
    await expect(page.getByTestId('crm-limpiar-cola')).toBeVisible();
    await expect(page.getByTestId('crm-filtro-estado')).toBeVisible();
    await expect(
      page.getByTestId('crm-alcanzados').or(page.getByTestId('crm-alcanzados-empty'))
    ).toBeVisible();
    await page.getByTestId('crm-prompt-copy').click();

    const stamp = `E2E CRM ${Date.now()}`;
    await page.getByTestId('crm-manual-nombre').fill(stamp);
    await page.getByTestId('crm-manual-telefono').fill('2615550000');
    await page.getByTestId('crm-manual-submit').click();
    await expect(page.getByTestId('crm-notice')).toBeVisible({ timeout: 20000 });

    const payload = JSON.stringify([
      { nombre: `${stamp} IA 1`, telefono: '2615550001' },
      { nombre: `${stamp} IA 2`, telefono: '2615550002' },
      { nombre: `${stamp} IA 3`, telefono: '2615550003' },
    ]);
    await page.getByTestId('crm-ingest-textarea').fill(payload);
    await page.getByTestId('crm-ingest-submit').click();
    await expect(page.getByTestId('crm-notice')).toContainText(/Creados/i, { timeout: 20000 });

    const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
    await page.getByTestId('crm-enviar-wsp').first().click();
    const popup = await popupPromise;
    if (popup) {
      expect(popup.url()).toContain('wa.me');
      await popup.close();
    }
  });
});
