import type { Core } from '@strapi/strapi';
import { ADMIN_EMAILS } from '../utils/constants';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Resend exige `email` o `Name <email>`. No doblar el formato si el env ya lo trae. */
export function resolveResendFromAddress(
  envFrom = process.env.RESEND_DEFAULT_FROM,
  displayName = 'San Rafael 360'
): string {
  const raw = (envFrom || 'no-reply@sanrafael360.com').trim().replace(/^["']|["']$/g, '');
  if (!raw) return `${displayName} <no-reply@sanrafael360.com>`;
  if (raw.includes('<') && raw.includes('>')) return raw;
  return `${displayName} <${raw}>`;
}

/**
 * Envío de email vía Resend (plugin Strapi).
 * Por defecto no relanza errores (fire-and-forget) para no romper flujos de negocio.
 */
export function createNotificationService(strapi: Core.Strapi | any) {
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
        from: resolveResendFromAddress(),
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
