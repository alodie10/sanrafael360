import type { Core } from '@strapi/strapi';
import { ADMIN_EMAILS } from '../utils/constants';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Envío de email vía Resend (plugin Strapi).
 * Por defecto no relanza errores (fire-and-forget) para no romper flujos de negocio.
 */
export function createNotificationService(strapi: Core.Strapi | any) {
  const fromAddress = () =>
    `San Rafael 360 <${process.env.RESEND_DEFAULT_FROM || 'no-reply@sanrafael360.com'}>`;

  async function sendEmail(
    input: SendEmailInput,
    options: { throwOnError?: boolean } = {}
  ): Promise<boolean> {
    const { throwOnError = false } = options;
    try {
      const emailService = strapi.plugin('email')?.service('email');
      if (!emailService) {
        strapi.log.warn('[NotificationService] Plugin email no disponible');
        if (throwOnError) throw new Error('Servicio de email no disponible');
        return false;
      }

      await emailService.send({
        to: input.to,
        from: fromAddress(),
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      return true;
    } catch (err: any) {
      strapi.log.error(`[NotificationService] sendEmail: ${err.message}`);
      if (throwOnError) throw err;
      return false;
    }
  }

  async function sendAdminEmail(subject: string, html: string): Promise<void> {
    await Promise.all(ADMIN_EMAILS.map((email) => sendEmail({ to: email, subject, html })));
  }

  return { sendEmail, sendAdminEmail };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
