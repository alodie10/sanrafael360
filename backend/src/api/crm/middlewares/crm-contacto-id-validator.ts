import { ValidationError } from '../../../utils/errors';
import { assertEstado } from '../crm-estado';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (!ctx.params?.documentId) {
      throw new ValidationError('documentId es requerido');
    }
    const estado = ctx.request.body?.estado;
    if (estado != null) assertEstado(estado);
    if (ctx.request.body?.nota != null && typeof ctx.request.body.nota !== 'string') {
      throw new ValidationError('nota inválida');
    }
    await next();
  };
};
