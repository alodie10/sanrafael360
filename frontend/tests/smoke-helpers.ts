import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

/** Evita que localStorage apunte a otro Strapi que el del servidor Next (causa 404 en fichas). */
export async function prepareSmokePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('STRAPI_BACKEND_OVERRIDE');
  });
}

async function waitForBusinessDetail(page: Page): Promise<void> {
  const notFoundHeading = page.getByRole('heading', {
    name: /no encontramos este lugar|not found|404/i,
  });

  await Promise.race([
    page.getByTestId('business-detail-page').waitFor({ state: 'visible', timeout: 30000 }),
    notFoundHeading.waitFor({ state: 'visible', timeout: 30000 }),
  ]).catch(() => undefined);

  if (await notFoundHeading.isVisible().catch(() => false)) {
    test.skip(true, 'Negocio no publicado en el Strapi del servidor (revisá NEXT_PUBLIC_STRAPI_URL).');
  }

  const hasDetail = await page.getByTestId('business-detail-page').isVisible().catch(() => false);

  if (!hasDetail) {
    throw new Error('La ficha de negocio no cargó (timeout). ¿Backend en :1337 y frontend reiniciado?');
  }
}

/** Navega al primer negocio visible en la home. */
export async function openFirstBusinessFromHome(page: Page): Promise<string> {
  await prepareSmokePage(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: /Qué buscas/i }).waitFor({ state: 'visible', timeout: 15000 });

  const cards = page.locator('a[href^="/negocios/"]');
  await cards.first().waitFor({ state: 'visible', timeout: 15000 });
  const href = await cards.first().getAttribute('href');
  if (!href) {
    test.skip(true, 'No hay negocios en el directorio para este entorno.');
  }

  await cards.first().click();
  await waitForBusinessDetail(page);
  return href!;
}

/** Abre un slug; skip si el negocio no existe en este entorno. */
export async function gotoBusinessOrSkip(page: Page, slug: string): Promise<void> {
  await prepareSmokePage(page);
  const response = await page.goto(`/negocios/${slug}`, { waitUntil: 'domcontentloaded' });
  const notFound =
    response?.status() === 404 ||
    (await page.getByRole('heading', { name: /no encontramos este lugar|not found/i }).isVisible().catch(() => false));

  if (notFound) {
    test.skip(true, `Negocio /negocios/${slug} no existe en este entorno.`);
  }

  await waitForBusinessDetail(page);
}
