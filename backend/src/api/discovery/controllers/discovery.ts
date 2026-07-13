import type { Core } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { syncGoogleBusiness } from '../services/discovery-sync';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  googleSync: asyncHandler(async (ctx: any) => {
    const { name } = ctx.request.body;
    const result = await syncGoogleBusiness(name, strapi);
    return ctx.send(result);
  }),
});
