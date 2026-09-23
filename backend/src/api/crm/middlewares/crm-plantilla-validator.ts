import { ValidationError } from '../../../utils/errors';
import { normalizePlantillaSlots } from '../../../utils/plantilla-slots';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const body = ctx.request.body || {};
    const slots = normalizePlantillaSlots(body.slots ?? body.mensajes, body.mensaje);
    if (!slots[0].texto) {
      throw new ValidationError('mensaje es requerido');
    }
    if (body.firma != null && typeof body.firma !== 'string') {
      throw new ValidationError('firma debe ser texto');
    }
    ctx.request.body = {
      ...body,
      mensaje: slots[0].texto,
      mensajes: slots,
      slots,
      firma: typeof body.firma === 'string' ? body.firma : body.firma || '',
    };
    await next();
  };
};
