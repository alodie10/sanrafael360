import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { requireTestCredentials, requireAdminTestCredentials } from './test-env';
import { loginWithTestCredentials } from './auth-helper';
import { getStrapiJwt } from './strapi-auth';

/** Fixture local estable (existe en scratch/data.db; se resetea al inicio). */
const SLUG = 'el-palacio-de-la-empanada';

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

    const adminJwt = await getStrapiJwt(strapiUrl, adminEmail, adminPassword);

    let resetRes;
    for (let i = 0; i < 3; i++) {
      resetRes = await request.post(`${strapiUrl}/api/negocios/${SLUG}/test-reset`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      });
      if (resetRes.ok()) break;
      await page.waitForTimeout(2000);
    }
    expect(
      resetRes?.ok(),
      `test-reset falló: ${resetRes?.status()} ${await resetRes?.text()}`
    ).toBeTruthy();

    await loginWithTestCredentials(page, userEmail, userPassword);

    await page.goto(`/negocios/${SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.reload({ waitUntil: 'networkidle' });

    const claimBtn = page.getByTestId('claim-profile-button');
    await expect(claimBtn).toBeVisible({ timeout: 10000 });
    await claimBtn.click();
    await expect(page.getByTestId('claim-modal')).toBeVisible();
    await page.getByTestId('claim-message').fill('Test adjunto de propiedad');

    const file = path.join(__dirname, 'test-val.txt');
    fs.writeFileSync(file, 'Validacion de propiedad dummy');
    await page.setInputFiles('[data-testid="claim-file-upload"]', file);

    await page.getByTestId('claim-submit').click();
    await expect(page.getByTestId('claim-success')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/pendiente/i)).toBeVisible();

    await loginWithTestCredentials(page, adminEmail, adminPassword);
    await page.goto('/portal/admin');
    await page.getByRole('button', { name: /Reclamos de Propiedad/i }).click();

    await expect(page.getByRole('heading', { name: /palacio de la empanada/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('link', { name: /validar archivo/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
