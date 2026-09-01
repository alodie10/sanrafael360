import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const id = body.negocioDocumentId;
    const tipo = body.tipo;

    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('negocioDocumentId es requerido');
    }
    if (tipo !== 'saludo' && tipo !== 'ficha_mensaje') {
      throw new ValidationError('tipo debe ser saludo o ficha_mensaje');
    }

    await next();
  };
};
