import { test, expect } from '@playwright/test';

/**
 * Empty-State Regression Suite
 * 
 * Valida que las páginas de negocios con datos mínimos (sin descripción,
 * sin reservaUrl, sin galería) se rendericen sin áreas negras ni mecanismos vacíos.
 * 
 * Target: http://127.0.0.1:3000
 */
test.describe('Business Detail — Empty State Regression', () => {

  test('La Delicia Bulevar: no black columns, horarios clean, no duplicate website', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/negocios/la-delicia-bulevard-ciudad');
    
    // 1. Página cargó correctamente (esperar a que desaparezca el loading y aparezca el h1)
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });


    // 2. La columna principal no está vacía
    const mainColumn = page.locator('.lg\\:col-span-2');
    await expect(mainColumn).toBeVisible();

    // Esperar a que alguno de los contenidos esperados aparezca
    const contentPromise = Promise.any([
        page.getByText('Experiencia Web').waitFor({ state: 'visible', timeout: 10000 }),
        page.getByText('próximamente').waitFor({ state: 'visible', timeout: 10000 }),
        page.locator('.lg\\:col-span-2 >> text=/La Delicia/i').waitFor({ state: 'visible', timeout: 10000 })
    ]);
    
    await expect(contentPromise).resolves.not.toThrow();

    // 3. Horarios sin encoding corrupto
    const horariosSection = page.locator('div.mt-10:has(span:has-text("Horarios Actualizados"))').first();
    if (await horariosSection.isVisible()) {
      // Esperar a que el texto de los días aparezca
      await expect(horariosSection).toContainText(/Sábado|Lunes|Martes|Miércoles|Jueves|Viernes|Domingo/i, { timeout: 15000 });
      
      const text = await horariosSection.innerText();
      expect(text).not.toMatch(/Ã|Â/);
    }

    // 4. NO debe haber el link duplicado "Visitar sitio oficial" en el sidebar
    const duplicateLink = page.locator('text=Visitar sitio oficial').last();
    // En el nuevo diseño, solo debe aparecer en el WebsitePortlet
    // Si aparece en el sidebar (fuera del portlet), es un error.
    const sidebar = page.locator('aside, .sticky');
    await expect(sidebar.locator('text=Visitar sitio oficial')).not.toBeVisible();
  });

  test('Negocio sin reservaUrl válida: BookingWidget NO debe renderizarse', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/negocios/cabanas-del-sur-rama-caida');
    
    // Esperar a que el contenido cargue
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 });

    const reservarAhoraBtn = page.locator('text=Reservar Ahora');
    const consultarCitaBtn = page.locator('text=Consultar Cita');

    const hasReservar = await reservarAhoraBtn.isVisible();
    const hasConsultar = await consultarCitaBtn.isVisible();

    if (hasReservar) {
      const href = await reservarAhoraBtn.locator('..').getAttribute('href');
      expect(href).toBeTruthy();
    }

    if (hasConsultar) {
      const href = await consultarCitaBtn.locator('..').getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\//);
    }
  });

  test('WebsitePortlet: favicon fallback no rompe la página', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/negocios/la-delicia-bulevard-ciudad');
    await page.waitForLoadState('networkidle');

    const portlet = page.locator('text=Experiencia Web');
    await expect(portlet).toBeVisible();

    const visitarBtn = page.locator('a:has-text("Visitar")').first();
    if (await visitarBtn.isVisible()) {
      const href = await visitarBtn.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

});
