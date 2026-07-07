import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { requireTestCredentials } from './test-env';
import { loginWithTestCredentials } from './auth-helper';

/**
 * Global Setup: Autenticación única para toda la suite.
 * Usa CredentialsProvider (solo activo con PLAYWRIGHT_TEST=1).
 */
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth/user.json');

async function globalSetup(_config: FullConfig) {
  if (process.env.PLAYWRIGHT_SMOKE_ONLY === '1') {
    console.log('\n⏭️  [Global Setup] Smoke-only: omitiendo autenticación.');
    return;
  }

  const { email: testEmail, password: testPassword } = requireTestCredentials();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\n🔐 [Global Setup] Authenticating as ${testEmail}...`);

  await loginWithTestCredentials(page, testEmail, testPassword);

  await page.context().storageState({ path: STORAGE_STATE_PATH });
  console.log(`✅ [Global Setup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}

export default globalSetup;
