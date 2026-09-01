import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const texto = body.texto_ficha;
    const mensaje = body.mensaje;

    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      throw new ValidationError('texto_ficha es requerido');
    }
    if (!mensaje || typeof mensaje !== 'string' || !mensaje.trim()) {
      throw new ValidationError('mensaje es requerido');
    }
    if (body.firma != null && typeof body.firma !== 'string') {
      throw new ValidationError('firma debe ser texto');
    }

    ctx.request.body = {
      texto_ficha: texto.trim(),
      mensaje: mensaje.trim(),
      firma: typeof body.firma === 'string' ? body.firma.trim() : '',
    };

    await next();
  };
};
