import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'tests', '.auth', 'user.json');

const testEnv = {
  PLAYWRIGHT_TEST: '1',
  NEXT_PUBLIC_PLAYWRIGHT_TEST: '1',
};

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  timeout: 60000,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL:
      process.env.PLAYWRIGHT_TEST_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-smoke',
      testMatch: /navigation\.spec\.ts|empty-state\.spec\.ts/,
      grep: /@smoke/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-auth',
      testMatch: /(?!google-sync|automated-claim).*\.spec\.ts/,
      grepInvert: /@smoke/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
    {
      name: 'chromium-integration',
      testMatch: /google-sync\.spec\.ts|automated-claim\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],

  webServer: skipWebServer
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          ...process.env,
          ...testEnv,
        },
      },
});
