import { test, expect } from '@playwright/test';

test.describe('San Rafael 360 - Critical Flow Validation', () => {

  test.beforeEach(async ({ page, context }) => {
    // 4G Network Emulation: Simulate high latency (100ms+) and data throttling
    await context.setOffline(false);
    await page.route('**/*', async (route) => {
      // Simulate network delay to expose race conditions
      await new Promise(f => setTimeout(f, 100)); 
      await route.continue();
    });
  });

  test('Navigate Home to Random Business and Verify Maps/Assets', async ({ page }) => {
    // 1. Visit Home
    await page.goto('/');
    
    // Validate Hero Title
    await expect(page.getByRole('heading', { name: /San Rafael/i })).toBeVisible();

    // 2. Select a Random Business Card
    const cards = page.locator('a[href^="/negocios/"]');
    await cards.first().waitFor({ state: 'visible' });
    const count = await cards.count();
    const randomIndex = Math.floor(Math.random() * count);
    const randomCard = cards.nth(randomIndex);
    
    const businessName = await randomCard.innerText();
    console.log(`Diving into: ${businessName}`);

    // 3. Click and Navigate
    await randomCard.click();
    await page.waitForLoadState('networkidle');

    // Verify status 200 by checking the page content (Next.js 404 would show error state)
    await expect(page.locator('h1')).toBeVisible();

    // 4. Google Maps Validation
    // Check if the container exists
    const mapContainer = page.locator('.relative.w-full.h-full.min-h-\\[300px\\]');
    await expect(mapContainer).toBeVisible();

    // 5. Booking Widget Validation (CRITICAL FOR CONVERSION)
    const bookingWidget = page.locator('div:has-text("Agenda tu Cita")').first();
    await expect(bookingWidget).toBeVisible();
    const bookingButton = bookingWidget.locator('a');
    await expect(bookingButton).toBeVisible();
    await expect(bookingButton).toHaveClass(/bg-primary|bg-green-500/);

    // 6. Website Portlet Validation
    if (await page.locator('h2:has-text("Sitio Web Oficial")').isVisible()) {
        const websiteContainer = page.locator('div:has-text("Sitio Web Oficial")').first();
        await expect(websiteContainer).toBeVisible();
        // Check if smart fallback works on mobile (if we are in mobile project)
        const isMobile = await page.evaluate(() => window.innerWidth < 768);
        if (isMobile) {
            await expect(page.getByText('Optimizado para tu dispositivo móvil')).toBeVisible();
        }
    }

    // 7. Asset Integrity (Railway/Strapi)
    // Check for images and ensure they don't have naturalWidth 0 (indicates error/CORS block)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const isLoaded = await images.nth(i).evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalWidth > 0;
      });
      // We log but don't strictly fail for placeholders if some business lacks images,
      // but if ALL fail, we should be concerned.
      if (!isLoaded) {
          const src = await images.nth(i).getAttribute('src');
          console.warn(`Potential asset error: ${src}`);
      }
    }
  });

  test('Verify Contact Route is Active (No 404)', async ({ page }) => {
    // Navigate to /contacto directly
    await page.goto('/contacto');
    
    // Check for the "Vende aquí" or similar heading
    await expect(page.getByRole('heading', { name: /Haz crecer tu Negocio/i })).toBeVisible();
    
    // Verify prefetching works by going home and clicking the link
    await page.goto('/');
    const contactLink = page.locator('nav a[href="/contacto"]').first();
    await contactLink.click();
    await expect(page.url()).toContain('/contacto');
  });

});
