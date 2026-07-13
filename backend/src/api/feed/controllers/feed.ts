import type { Core } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { assertFeedAccess, createFeedService } from '../services/feed-service';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  metaCatalog: asyncHandler(async (ctx: any) => {
    if (!assertFeedAccess(ctx)) return;

    const csvContent = await createFeedService(strapi).buildMetaCatalogCsv();
    ctx.set('Content-Type', 'text/csv; charset=utf-8');
    ctx.set('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
    ctx.body = csvContent;
  }),

  metaOffers: asyncHandler(async (ctx: any) => {
    if (!assertFeedAccess(ctx)) return;

    const csvContent = await createFeedService(strapi).buildMetaOffersCsv();
    ctx.set('Content-Type', 'text/csv; charset=utf-8');
    ctx.set('Content-Disposition', 'attachment; filename="meta-offers.csv"');
    ctx.body = csvContent;
  }),
});
