import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } }); // Bypass global-setup

const BASE_URL = 'https://www.sanrafael360.com';
const API_URL = 'https://sanrafael360-production.up.railway.app';

test.describe('Auditoría de Integridad San Rafael 360', () => {

  test('Public: Home y Navegación Básica', async ({ page }) => {
    console.log('🔍 Verificando Home...');
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/San Rafael 360/);
    
    // Verificar que existan negocios cargados
    const businessCards = page.locator('.group.relative.bg-zinc-900\\/50');
    const count = await businessCards.count();
    console.log(`📊 Negocios encontrados en Home: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('Public: Detalle de Negocio y Reseñas', async ({ page }) => {
    console.log('🔍 Verificando Detalle de Negocio...');
    // Vamos a un negocio conocido (Hotel Ambar)
    await page.goto(`${BASE_URL}/negocios/apart-hotel-ambar`);
    
    // Verificar que cargue el nombre
    await expect(page.locator('h1')).toContainText('Apart Hotel Ámbar');
    
    // Verificar que la sección de reseñas esté presente
    const reviewSection = page.locator('text=Reseñas');
    await expect(reviewSection).toBeVisible();
    
    // Verificar si el promedio de estrellas es visible
    const rating = page.locator('.text-4xl.font-black');
    const ratingText = await rating.innerText();
    console.log(`⭐ Rating actual detectado: ${ratingText}`);
    expect(Number(ratingText)).toBeGreaterThanOrEqual(0);
  });

  test('API: Verificación de Sesión y Dashboard (Health Check)', async ({ request }) => {
    console.log('🔍 Verificando API de Negocios Propios...');
    // Este test fallará si no hay un token válido, lo cual es correcto como auditoría
    const response = await request.get(`${API_URL}/api/negocios/me`);
    console.log(`📡 Status API /me: ${response.status()}`);
    
    // No esperamos un 200 si no estamos logueados, pero sí que no de 500
    expect(response.status()).not.toBe(500);
  });

});
