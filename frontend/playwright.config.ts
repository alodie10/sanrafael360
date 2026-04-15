import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration — San Rafael 360
 * 
 * Arquitectura de autenticación:
 * - Un proyecto "setup" hace login UNA vez y guarda el storageState.
 * - Todos los browsers (Chromium, Mobile Safari) inyectan ese state directamente.
 * - Esto elimina los falsos negativos de cookies virtualizadas en WebKit.
 * 
 * Ver: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 */

const authFile = path.join(__dirname, 'tests', '.auth', 'user.json');

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Global timeout per test */
  timeout: 60000,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Parallel workers */
  workers: 2,
  /* Reporter */
  reporter: 'list',

  /* Shared settings for all projects */
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ||
             (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // ------------------------------------------------------------------
    // Chromium (Desktop): usa el storageState del global setup
    // ------------------------------------------------------------------
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },

    // ------------------------------------------------------------------
    // Mobile Safari (WebKit): inyecta el mismo storageState
    // Esto resuelve el problema de cookies virtualizadas en WebKit
    // ------------------------------------------------------------------
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        storageState: authFile,
      },
    },
  ],

  /* Dev server (solo en CI) */
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
