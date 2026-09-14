/**
 * Cron jobs Strapi 5.
 * Sync de reseñas Google: diario, solo premium, si cache > 30 días o null.
 */
export default {
  syncGoogleReviewsMonthly: {
    task: async ({ strapi }) => {
      strapi.log.info('[Cron] syncGoogleReviewsMonthly — inicio (solo premium)');
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
  syncOfertaVigencia: {
    task: async ({ strapi }) => {
      strapi.log.info('[Cron] syncOfertaVigencia — inicio');
      try {
        const result = await strapi.service('api::oferta.oferta').syncVigencia();
        strapi.log.info(
          `[Cron] syncOfertaVigencia — checked=${result.checked} on=${result.activated} off=${result.deactivated}`
        );
      } catch (err: any) {
        strapi.log.error(`[Cron] syncOfertaVigencia error: ${err?.message || err}`);
      }
    },
    options: {
      // Cada 15 min: activa al entrar en el rango y apaga al vencer.
      rule: '0 */15 * * * *',
    },
  },
};
