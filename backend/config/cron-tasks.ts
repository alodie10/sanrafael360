/**
 * Cron jobs Strapi 5.
 * Sync de reseñas Google: diario, pero cada negocio solo si cache > 30 días o null.
 */
export default {
  syncGoogleReviewsMonthly: {
    task: async ({ strapi }) => {
      strapi.log.info('[Cron] syncGoogleReviewsMonthly — inicio');
      try {
        const result = await strapi
          .service('api::negocio.negocio')
          .syncStaleGoogleReviews({ staleDays: 30, limit: 200 });
        strapi.log.info(
          `[Cron] syncGoogleReviewsMonthly — checked=${result.checked} synced=${result.synced} failed=${result.failed} skipped=${result.skipped}`
        );
      } catch (err: any) {
        strapi.log.error(`[Cron] syncGoogleReviewsMonthly error: ${err?.message || err}`);
      }
    },
    options: {
      // Todos los días a las 04:00 UTC — el service impone el tope de 30 días por negocio.
      rule: '0 0 4 * * *',
    },
  },
};
