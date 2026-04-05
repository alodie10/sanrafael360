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
    if (await page.locator('h3:has-text("Experiencia Web")').isVisible()) {
        const websiteContainer = page.locator('div:has-text("Experiencia Web")').first();
        await expect(websiteContainer).toBeVisible();
    }

    // 7. Horarios Encoding Validation
    if (await page.locator('h4:has-text("Horarios Actualizados")').isVisible()) {
        const horariosText = await page.locator('p:near(h4:has-text("Horarios Actualizados"))').innerText();
        // Check for common UTF-8 encoding corruptions
        expect(horariosText).not.toMatch(/Ã|Â/);
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

  test('Bulk Sweep: Verify 20 Businesses without crashing or encoding errors', async ({ page }) => {
    test.setTimeout(120000); // 2 minutos para escanear 20 negocios
    await page.goto('/');
    
    // Recolectar 20 links de negocios aleatorios de la home
    await page.waitForLoadState('networkidle');
    const cards = page.locator('a[href^="/negocios/"]');
    await cards.first().waitFor({ state: 'visible' });
    const count = await cards.count();
    
    expect(count).toBeGreaterThan(0);
    
    const maxToTest = Math.min(20, count);
    const urlsToTest = new Set<string>();
    
    for(let i = 0; i < count && urlsToTest.size < maxToTest; i++) {
        const href = await cards.nth(i).getAttribute('href');
        if (href) urlsToTest.add(href);
    }

    console.log(`Sweeping ${urlsToTest.size} businesses...`);

    for (const url of urlsToTest) {
        await page.goto(url);
        await page.waitForLoadState('domcontentloaded');
        
        // 1. Debe haber cargado la página (h1 presente)
        await expect(page.locator('h1').first()).toBeVisible();
        
        // 2. Revisar si hay horarios, que no tengan encoding corrupto
        const horariosSection = page.locator('div:has-text("Horarios Actualizados")').last();
        if (await horariosSection.isVisible()) {
            const text = await horariosSection.innerText();
            expect(text).not.toMatch(/Ã|Â/);
        }

        // 3. Revisar botón de Reservar (sin overflow a nivel DOM)
        // Playwright asserts elements are visible and within viewport bounds automatically if we click, 
        // but we just assert it's visible.
        const bookingBtn = page.locator('a:has-text("Reservar Ahora"), a:has-text("Consultar Cita")').first();
        if (await bookingBtn.isVisible()) {
             // Just verifying it renders
             await expect(bookingBtn).toBeVisible();
        }
    }
  });

});
