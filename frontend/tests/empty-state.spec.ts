import { test, expect } from '@playwright/test';
import { openFirstBusinessFromHome, prepareSmokePage } from './smoke-helpers';

test.describe('Business Detail — Empty State Regression', () => {

  test.beforeEach(async ({ page }) => {
    await prepareSmokePage(page);
  });

  test('Ficha de negocio carga sin errores de encoding @smoke', async ({ page }) => {
    test.setTimeout(60000);
    await openFirstBusinessFromHome(page);

    await expect(page.getByTestId('business-detail-page')).toBeVisible();

    const hoursSection = page.getByTestId('business-hours-section');
    if (await hoursSection.isVisible()) {
      const text = await hoursSection.innerText();
      expect(text).not.toMatch(/Ã|Â/);
    }
  });

  test('Negocio sin booking widget no rompe la ficha @smoke', async ({ page }) => {
    test.setTimeout(60000);
    await openFirstBusinessFromHome(page);

    const reservarAhoraBtn = page.locator('text=Reservar Ahora');
    const consultarCitaBtn = page.locator('text=Consultar Cita');

    if (await reservarAhoraBtn.isVisible()) {
      const href = await reservarAhoraBtn.locator('..').getAttribute('href');
      expect(href).toBeTruthy();
    }

    if (await consultarCitaBtn.isVisible()) {
      const href = await consultarCitaBtn.locator('..').getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\//);
    }

    await expect(page.getByTestId('business-detail-page')).toBeVisible();
  });

  test('WebsitePortlet no rompe la página @smoke', async ({ page }) => {
    test.setTimeout(60000);
    await openFirstBusinessFromHome(page);

    const portlet = page.locator('text=Experiencia Web');
    if (!(await portlet.isVisible())) {
      test.skip(true, 'El primer negocio listado no tiene Experiencia Web en este entorno.');
    }

    await expect(portlet).toBeVisible();

    const visitarBtn = page.locator('a:has-text("Visitar")').first();
    if (await visitarBtn.isVisible()) {
      const href = await visitarBtn.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
