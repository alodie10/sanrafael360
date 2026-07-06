import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  convert: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const { negocioId } = ctx.request.body;

    if (!negocioId) {
      throw new ValidationError('Negocio ID es requerido');
    }

    const result = await strapi.service('api::lead.lead').convertLead(id, negocioId);
    ctx.send(result);
  }),
}));
