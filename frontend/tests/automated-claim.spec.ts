import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SLUG = 'after-house';
const CREDS = {
  user: { email: 'argendeli01@gmail.com', pass: 'DcaDca_01' },
  admin: { email: 'diegocristianalonso@gmail.com', pass: 'DcaDca_01' }
};

test.describe('Workflow de Reclamo', () => {
  test('ciclo completo: reset, reclamo con archivo y verificacion admin', async ({ page, request }) => {
    // 1. Reset
    const STRAPI_URL = 'http://localhost:1337';
    console.log(`Resetting ${SLUG}...`);
    let resetRes;
    for(let i=0; i<3; i++) {
        resetRes = await request.post(`${STRAPI_URL}/api/negocios/${SLUG}/test-reset`);
        if (resetRes.ok()) break;
        await page.waitForTimeout(2000);
    }
    expect(resetRes?.ok()).toBeTruthy();

    // 2. User Login
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDS.user.email);
    await page.fill('input[type="password"]', CREDS.user.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('/portal');

    // 3. Reclamar con archivo
    await page.goto(`/negocios/${SLUG}`);
    await page.waitForLoadState('networkidle');
    // Force reload to bypass Next.js cache for the fresh reset state
    await page.reload({ waitUntil: 'networkidle' });
    const claimBtn = page.getByRole('button', { name: /reclamar perfil/i });
    await expect(claimBtn).toBeVisible({ timeout: 10000 });
    await claimBtn.click();
    await page.fill('textarea', 'Test adjunto');
    
    const file = path.join(__dirname, 'test-val.txt');
    fs.writeFileSync(file, 'Validacion de propiedad dummy');
    await page.setInputFiles('input[type="file"]', file);

    page.on('dialog', d => d.accept());
    await page.click('button:has-text("Enviar Solicitud")');
    await expect(page.getByText(/pendiente/i)).toBeVisible();

    // 4. Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDS.admin.email);
    await page.fill('input[type="password"]', CREDS.admin.pass);
    await page.click('button[type="submit"]');
    // Wait for login to settle and go to admin manually
    await page.waitForURL(url => url.pathname.startsWith('/portal'));
    await page.goto('/portal/admin');

    // 5. Verificar Doc
    // Use heading role for more robust matching in the admin list
    await expect(page.getByRole('heading', { name: /after house/i })).toBeVisible();
    const link = page.getByRole('link', { name: /validar archivo/i });
    await expect(link).toBeVisible({ timeout: 10000 });
    console.log('Success: Attachment link "Validar Archivo" found in admin!');
  });
});
