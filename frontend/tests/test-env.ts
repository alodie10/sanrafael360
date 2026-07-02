/**
 * Credenciales de prueba — nunca hardcodear passwords reales en specs.
 * Definir en frontend/.env.test.local o exportar antes de correr Playwright:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... npm run test:e2e
 */
export function requireTestCredentials(): { email: string; password: string } {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Faltan TEST_USER_EMAIL y/o TEST_USER_PASSWORD. ' +
        'Configúralas en frontend/.env.test.local o en tu shell antes de ejecutar Playwright.'
    );
  }

  return { email, password };
}

export function requireAdminTestCredentials(): { email: string; password: string } {
  const email = process.env.TEST_ADMIN_EMAIL || process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Faltan TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD (o TEST_USER_* como fallback). ' +
        'Configúralas antes de ejecutar tests que requieren admin.'
    );
  }

  return { email, password };
}

/** Password genérico para registros efímeros en tests (no es credencial de prod). */
export const EPHEMERAL_TEST_PASSWORD = 'Test_Sprint0_Password!';
