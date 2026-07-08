import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError } from '../../../utils/errors';

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  convert: asyncHandler(async (ctx) => {
    if (!ctx.state?.adminUser) {
      throw new ForbiddenError('Acceso restringido a administradores');
    }

    const { id } = ctx.params;
    const { negocioId } = ctx.request.body;

    const result = await strapi.service('api::lead.lead').convertLead(id, negocioId);
    ctx.send(result);
  }),
}));
