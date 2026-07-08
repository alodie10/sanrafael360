import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError, ValidationError } from '../../../utils/errors';

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  convert: asyncHandler(async (ctx) => {
    const { id } = ctx.params;
    const { negocioId } = ctx.request.body;

    // Defensa en profundidad: la ruta usa global::require-admin,
    // pero si no llega middleware, evitamos conversión igualmente.
    if (!ctx.state?.adminUser) {
      throw new ForbiddenError('Acceso restringido a administradores');
    }

    if (!negocioId) {
      throw new ValidationError('Negocio ID es requerido');
    }

    const result = await strapi.service('api::lead.lead').convertLead(id, negocioId);
    ctx.send(result);
  }),
}));
