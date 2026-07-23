/**
 * One-shot backfill: sync reseñas Google.
 * Uso:
 *   npm run sync:google-reviews
 *   SYNC_SLUG=aires-de-mar npm run sync:google-reviews
 */
const { createStrapi } = require('@strapi/strapi');

async function main() {
  console.log('[sync-google-reviews] Loading Strapi...');
  const app = createStrapi({ distDir: './dist' });
  await app.load();

  const slug = process.env.SYNC_SLUG?.trim();
  const result = slug
    ? await app.service('api::negocio.negocio').syncGoogleReviewsForSlug(slug)
    : await app.service('api::negocio.negocio').syncStaleGoogleReviews({ staleDays: 30, limit: 500 });

  console.log('[sync-google-reviews] Resultado:', result);
  await app.destroy();
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[sync-google-reviews] Fatal:', err);
  process.exit(1);
});
