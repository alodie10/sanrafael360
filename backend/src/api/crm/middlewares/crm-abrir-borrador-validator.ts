import { ForbiddenError, ValidationError } from '../../../utils/errors';
import { origenPuedeAbrirMail } from '../crm-mail-draft';
import { normalizeCrmEmail } from '../crm-enviar';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (process.platform !== 'darwin') {
      throw new ValidationError('Mail solo se abre en esta Mac');
    }
    if (!origenPuedeAbrirMail(ctx.get('origin'))) {
      throw new ForbiddenError('Origen no permitido');
    }
    const to = normalizeCrmEmail(ctx.request.body?.to);
    const subject = String(ctx.request.body?.subject || '').trim();
    const html = String(ctx.request.body?.html || '');
    if (!to) throw new ValidationError('to es requerido');
    if (!subject || subject.length > 200) throw new ValidationError('subject es requerido');
    if (!html || html.length > 500000) throw new ValidationError('html es requerido');
    ctx.state.crmBorrador = { to, subject, html };
    await next();
  };
};
