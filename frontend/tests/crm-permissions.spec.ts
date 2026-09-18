import { test, expect } from '@playwright/test';

test.describe('CRM piloto — aislamiento del portal', () => {
  test('un visitante sin sesión no entra a /portal/crm', async ({ page }) => {
    await page.goto('/portal/crm', { waitUntil: 'networkidle' });
    await page.waitForURL((url) => url.pathname === '/portal' || url.pathname === '/login', {
      timeout: 15000,
    });
    expect(page.url()).not.toContain('/portal/crm');
  });
});
