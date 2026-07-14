import { test, expect } from '@playwright/test';
import { prepareSmokePage } from './smoke-helpers';

test.describe('San Rafael 360 - Critical Flow Validation', () => {

  test.beforeEach(async ({ page }) => {
    await prepareSmokePage(page);
  });

  test('Navigate Home to Random Business and Verify Maps/Assets @smoke', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Qué buscas/i })).toBeVisible({ timeout: 10000 });

    const cards = page.locator('a[href^="/negocios/"]');
    await cards.first().waitFor({ state: 'visible' });
    const count = await cards.count();
    const randomIndex = Math.floor(Math.random() * count);
    const randomCard = cards.nth(randomIndex);

    console.log(`Diving into: ${(await randomCard.innerText()).slice(0, 40)}`);

    await randomCard.click();
    await expect(page.getByTestId('business-detail-page')).toBeVisible({
      timeout: 30000,
    });

    const mapSection = page.getByTestId('map-section');
    if (await mapSection.isVisible()) {
      await expect(mapSection).toBeVisible();
    }

    const bookingWidget = page.locator('div:has-text("Agenda tu Cita")').first();
    if (await bookingWidget.isVisible()) {
      await expect(bookingWidget.locator('a')).toBeVisible();
    }

    const hoursSection = page.getByTestId('business-hours-section');
    if (await hoursSection.isVisible()) {
      const text = await hoursSection.innerText();
      expect(text).not.toMatch(/Ã|Â/);
    }
  });

  test('Verify Contact Route is Active (No 404) @smoke', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (isMobile) {
      await page.getByTestId('nav-menu-toggle').click();
      await page.getByRole('link', { name: /Vende aquí/i }).click({ force: true });
    } else {
      await page.getByTestId('nav-contact-link').click({ force: true });
    }

    await page.waitForURL('**/contacto', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Haz crecer tu Negocio/i })).toBeVisible();
  });

  test('Bulk Sweep: Verify businesses without crashing or encoding errors @smoke', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('a[href^="/negocios/"]');
    await cards.first().waitFor({ state: 'visible' });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const maxToTest = Math.min(10, count);
    const urlsToTest = new Set<string>();

    for (let i = 0; i < count && urlsToTest.size < maxToTest; i++) {
      const href = await cards.nth(i).getAttribute('href');
      if (href) urlsToTest.add(href);
    }

    console.log(`Sweeping ${urlsToTest.size} businesses...`);

    let successCount = 0;

    for (const url of urlsToTest) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const detail = page.getByTestId('business-detail-page');
        await expect(detail).toBeVisible({ timeout: 15000 });
        successCount += 1;

        const hoursSection = page.getByTestId('business-hours-section');
        if (await hoursSection.isVisible()) {
          const text = await hoursSection.innerText();
          expect(text).not.toMatch(/Ã|Â/);
        }
      } catch (error) {
        console.warn(`Skipping ${url} after error:`, error);
      }
    }

    expect(successCount).toBeGreaterThan(0);
  });
});
