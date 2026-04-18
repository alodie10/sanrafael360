import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.', // Estamos dentro de /tests
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
