import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { requireTestCredentials, requireAdminTestCredentials } from './test-env';
import { loginWithTestCredentials } from './auth-helper';

const SLUG = 'after-house';

test.describe('Workflow de Reclamo', () => {
  test.beforeEach(() => {
    test.skip(
      !!process.env.CI,
      'Requiere Strapi local con endpoint test-reset (no disponible en CI).'
    );
  });

  test('ciclo completo: reset, reclamo con archivo y verificacion admin', async ({ page, request }) => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const { email: userEmail, password: userPassword } = requireTestCredentials();
    const { email: adminEmail, password: adminPassword } = requireAdminTestCredentials();

    let resetRes;
    for (let i = 0; i < 3; i++) {
      resetRes = await request.post(`${strapiUrl}/api/negocios/${SLUG}/test-reset`);
      if (resetRes.ok()) break;
      await page.waitForTimeout(2000);
    }
    expect(resetRes?.ok()).toBeTruthy();

    await loginWithTestCredentials(page, userEmail, userPassword);

    await page.goto(`/negocios/${SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.reload({ waitUntil: 'networkidle' });

    const claimBtn = page.getByTestId('claim-profile-button');
    await expect(claimBtn).toBeVisible({ timeout: 10000 });
    await claimBtn.click();
    await page.fill('textarea', 'Test adjunto');

    const file = path.join(__dirname, 'test-val.txt');
    fs.writeFileSync(file, 'Validacion de propiedad dummy');
    await page.setInputFiles('input[type="file"]', file);

    page.on('dialog', (d) => d.accept());
    await page.click('button:has-text("Enviar Solicitud")');
    await expect(page.getByText(/pendiente/i)).toBeVisible();

    await loginWithTestCredentials(page, adminEmail, adminPassword);
    await page.goto('/portal/admin');

    await expect(page.getByRole('heading', { name: /after house/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /validar archivo/i })).toBeVisible({ timeout: 10000 });
  });
});
