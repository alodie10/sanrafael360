import type { Page } from '@playwright/test';

/** Login vía formulario de test (requiere PLAYWRIGHT_TEST=1 en el servidor Next). */
export async function loginWithTestCredentials(
  page: Page,
  email: string,
  password: string,
  options?: { callbackUrl?: string }
): Promise<void> {
  const loginUrl = options?.callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(options.callbackUrl)}`
    : '/login';

  await page.goto(loginUrl);
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL((url) => url.pathname === '/portal' || url.pathname === '/', {
    timeout: 20000,
  });
}
