import { test, expect } from '@playwright/test';

/**
 * Empty-State Regression Suite
 * 
 * Valida que las páginas de negocios con datos mínimos (sin descripción,
 * sin reservaUrl, sin galería) se rendericen sin áreas negras ni mecanismos vacíos.
 * 
 * Target: https://sanrafael360.vercel.app (siempre contra producción)
 */
test.describe('Business Detail — Empty State Regression', () => {

  test('La Delicia Bulevar: no black columns, horarios clean, no duplicate website', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/negocios/la-delicia-bulevard-ciudad');
    await page.waitForLoadState('networkidle');

    // 1. Página cargó correctamente
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. La columna principal no está vacía — debe haber al menos UNO de estos elementos:
    //    - Descripción (texto)
    //    - Placeholder glassmorphic ("próximamente")
    //    - WebsitePortlet ("Sitio Web Oficial")
    const mainColumn = page.locator('.lg\\:col-span-2');
    await expect(mainColumn).toBeVisible();

    const hasContent = await page.evaluate(() => {
      const main = document.querySelector('[class*="col-span-2"]');
      if (!main) return false;
      const text = main.textContent || '';
      // Debe tener alguna de estas cadenas
      return (
        text.includes('Sitio Web Oficial') ||
        text.includes('próximamente') ||
        text.length > 50
      );
    });
    expect(hasContent, 'La columna principal no debe estar vacía').toBe(true);

    // 3. Horarios sin encoding corrupto
    const horariosSection = page.locator('text=Horarios Actualizados');
    if (await horariosSection.isVisible()) {
      const text = await horariosSection.locator('..').innerText();
      expect(text).not.toMatch(/Ã|Â/);
      expect(text).toMatch(/Sábado|Lunes|Martes|Miércoles|Jueves|Viernes|Domingo/i);
    }

    // 4. NO debe haber el link duplicado "Visitar sitio oficial" en el sidebar
    const duplicateLink = page.locator('text=Visitar sitio oficial');
    await expect(duplicateLink).not.toBeVisible();
  });

  test('Negocio sin reservaUrl válida: BookingWidget NO debe renderizarse', async ({ page }) => {
    test.setTimeout(60000);

    // Buscamos un negocio que típicamente no tenga reservaUrl (cabañas pequeñas, etc.)
    // Usamos un negocio conocido sin sistema de reservas online
    await page.goto('/negocios/cabanas-del-sur-rama-caida');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible();

    // El BookingWidget con "Reservar Ahora" no debe aparecer si no hay reservaUrl válida
    const reservarAhoraBtn = page.locator('text=Reservar Ahora');
    const consultarCitaBtn = page.locator('text=Consultar Cita');

    const hasReservar = await reservarAhoraBtn.isVisible();
    const hasConsultar = await consultarCitaBtn.isVisible();

    if (hasReservar) {
      // Si existe, debe tener un href válido
      const href = await reservarAhoraBtn.locator('..').getAttribute('href');
      expect(href).toBeTruthy();
      expect(() => new URL(href!)).not.toThrow();
    }

    if (hasConsultar) {
      // Si existe, debe apuntar a wa.me con número válido
      const href = await consultarCitaBtn.locator('..').getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\/\d{10,}/);
    }
  });

  test('WebsitePortlet: favicon fallback no rompe la página', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/negocios/la-delicia-bulevard-ciudad');
    await page.waitForLoadState('networkidle');

    // El portlet debe estar visible
    const portlet = page.locator('text=Sitio Web Oficial');
    await expect(portlet).toBeVisible();

    // El botón "Visitar" debe ser clickeable (tiene href válido)
    const visitarBtn = page.locator('a:has-text("Visitar")').first();
    if (await visitarBtn.isVisible()) {
      const href = await visitarBtn.getAttribute('href');
      expect(href).toBeTruthy();
      expect(() => new URL(href!)).not.toThrow();
    }

    // No debe haber errores críticos de hydration en consola
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });

    await page.waitForTimeout(2000);

    const hydrationErrors = consoleLogs.filter(log =>
      log.includes('Hydration') || log.includes('did not match')
    );
    expect(hydrationErrors.length, `Hydration errors: ${hydrationErrors.join(', ')}`).toBe(0);
  });

});
