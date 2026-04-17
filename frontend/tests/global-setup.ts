import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

/**
 * Global Setup: Autenticación Única para Todos los Browsers
 *
 * Este script corre UNA sola vez antes de toda la suite.
 * Hace login con credenciales reales → guarda las cookies en un archivo JSON.
 * Todos los proyectos (Chromium, Mobile Safari) inyectan ese storageState
 * en cada test, evitando el login manual y los falsos negativos de WebKit.
 */
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth/user.json');
export const ADMIN_STORAGE_STATE_PATH = path.join(__dirname, '.auth/admin.json');

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const testEmail = process.env.TEST_USER_EMAIL || 'argendeli01@gmail.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'DcaDca_01';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\n🔐 [Global Setup] Authenticating as ${testEmail}...`);

  await page.goto(`${baseURL}/login`);
  
  let loginSuccess = false;
  for(let i=0; i<3; i++) {
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL((url) => url.pathname === '/portal' || url.pathname === '/', { timeout: 10000 });
      loginSuccess = true;
      break;
    } catch (e) {
      console.log(`⚠️ Login attempt ${i+1} failed. Retrying...`);
      await page.reload();
    }
  }
  if (!loginSuccess) throw new Error(`Could not login as ${testEmail}`);

  // Guardar el estado de autenticación (cookies + localStorage)
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  console.log(`✅ [Global Setup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}

export default globalSetup;
