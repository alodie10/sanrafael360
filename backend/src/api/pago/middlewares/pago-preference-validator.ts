import { ValidationError } from '../../../utils/errors';

const allowedPlanTypes = new Set(['Mensual', 'Semestral']);

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const negocioId = body?.negocioId;
    const planType = body?.planType;

    if (!negocioId || typeof negocioId !== 'string' || !negocioId.trim()) {
      throw new ValidationError('negocioId es requerido');
    }

    if (planType != null) {
      const planTypeStr = String(planType);
      if (!allowedPlanTypes.has(planTypeStr)) {
        throw new ValidationError(`planType inválido. Valores permitidos: ${Array.from(allowedPlanTypes).join(', ')}`);
      }
    }

    await next();
  };
};

