import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { requireTestCredentials } from './test-env';
import { loginWithTestCredentials } from './auth-helper';

/**
 * Global Setup: Autenticación única para toda la suite.
 * Usa CredentialsProvider (solo activo con PLAYWRIGHT_TEST=1).
 */
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth/user.json');

async function resolveBaseURL(config: FullConfig): Promise<string> {
  const fromProject = config.projects.find((p) => p.use?.baseURL)?.use?.baseURL;
  const baseURL =
    (typeof fromProject === 'string' && fromProject) ||
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return baseURL.replace(/\/$/, '');
}

async function globalSetup(config: FullConfig) {
  if (process.env.PLAYWRIGHT_SMOKE_ONLY === '1') {
    console.log('\n⏭️  [Global Setup] Smoke-only: omitiendo autenticación.');
    return;
  }

  const { email: testEmail, password: testPassword } = requireTestCredentials();
  const baseURL = await resolveBaseURL(config);

  const browser = await chromium.launch();
  // globalSetup no hereda use.baseURL del runner; hay que setearlo en el context.
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  console.log(`\n🔐 [Global Setup] Authenticating as ${testEmail} @ ${baseURL}...`);

  await loginWithTestCredentials(page, testEmail, testPassword);

  await context.storageState({ path: STORAGE_STATE_PATH });
  console.log(`✅ [Global Setup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}

export default globalSetup;
