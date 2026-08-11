/** Emails con rol admin soberano — seguro importar desde Client Components. */
const BASE_ADMIN_EMAILS = [
  'diegocristianalonso@gmail.com',
  'mlauralodi@gmail.com',
];

/** Fixture E2E local (solo visible con NEXT_PUBLIC_PLAYWRIGHT_TEST=1). */
const E2E_ADMIN_EMAILS =
  process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === '1'
    ? ['e2e.admin@sanrafael360.test']
    : [];

export const ADMIN_EMAILS = [...BASE_ADMIN_EMAILS, ...E2E_ADMIN_EMAILS];
