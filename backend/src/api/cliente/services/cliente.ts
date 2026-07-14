import { factories } from '@strapi/strapi';
import { createClienteRepository } from '../repositories/cliente-repository';
import { createNotificationService } from '../../../services/notification-service';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { logActivity } from '../../../utils/strapi-utils';
import { wrapClienteAvisosEmail } from './templates/cliente-email-templates';
import {
  filterBroadcastRecipients,
  normalizeClienteEmail,
  type BroadcastAudience,
} from './cliente-mail-audience';
import { buildUnsubscribeUrl, verifyUnsubscribeToken } from './unsubscribe-token';

export type { BroadcastAudience };
export { filterBroadcastRecipients, normalizeClienteEmail } from './cliente-mail-audience';
export {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from './unsubscribe-token';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default factories.createCoreService('api::cliente.cliente', ({ strapi }) => ({
  async listClientes() {
    const repo = createClienteRepository(strapi);
    return repo.findMany();
  },

  async createCliente(input: {
    email: string;
    nombre: string;
    notas?: string;
    opt_out?: boolean;
    negocioIds?: string[];
  }) {
    const repo = createClienteRepository(strapi);
    const email = normalizeClienteEmail(input.email);
    if (!email || !input.nombre?.trim()) {
      throw new ValidationError('email y nombre son obligatorios');
    }

    const existing = await repo.findByEmail(email);
    if (existing) {
      throw new ValidationError(`Ya existe un cliente con email ${email}`);
    }

    const created = await repo.create({
      email,
      nombre: input.nombre.trim(),
      notas: input.notas?.trim() || undefined,
      opt_out: Boolean(input.opt_out),
    });

    if (input.negocioIds?.length) {
      await this.linkNegocios(created.documentId, input.negocioIds);
    }

    return repo.findByDocumentId(created.documentId);
  },

  async updateCliente(
    documentId: string,
    input: Partial<{ email: string; nombre: string; notas: string; opt_out: boolean }>
  ) {
    const repo = createClienteRepository(strapi);
    const current = await repo.findByDocumentId(documentId);
    if (!current) throw new NotFoundError('Cliente');

    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre.trim();
    if (input.notas !== undefined) data.notas = input.notas;
    if (input.opt_out !== undefined) data.opt_out = Boolean(input.opt_out);
    if (input.email !== undefined) {
      const email = normalizeClienteEmail(input.email);
      const existing = await repo.findByEmail(email);
      if (existing && existing.documentId !== documentId) {
        throw new ValidationError(`Ya existe un cliente con email ${email}`);
      }
      data.email = email;
    }

    await repo.update(documentId, data as any);
    return repo.findByDocumentId(documentId);
  },

  async deleteCliente(documentId: string) {
    const repo = createClienteRepository(strapi);
    const current = await repo.findByDocumentId(documentId, {
      negocios: { fields: ['documentId'] },
    });
    if (!current) throw new NotFoundError('Cliente');

    const linked = current.negocios || [];
    for (const n of linked) {
      await repo.setNegocioCliente(n.documentId, null);
    }

    await repo.delete(documentId);
    return { ok: true, documentId };
  },

  async linkNegocios(clienteDocumentId: string, negocioIds: string[]) {
    const repo = createClienteRepository(strapi);
    const cliente = await repo.findByDocumentId(clienteDocumentId);
    if (!cliente) throw new NotFoundError('Cliente');

    const ids = [...new Set(negocioIds.filter(Boolean))];
    if (ids.length === 0) throw new ValidationError('negocioIds es obligatorio');

    for (const negocioId of ids) {
      await repo.setNegocioCliente(negocioId, clienteDocumentId);
    }

    return repo.findByDocumentId(clienteDocumentId);
  },

  async unlinkNegocio(clienteDocumentId: string, negocioDocumentId: string) {
    const repo = createClienteRepository(strapi);
    const cliente = await repo.findByDocumentId(clienteDocumentId);
    if (!cliente) throw new NotFoundError('Cliente');

    await repo.setNegocioCliente(negocioDocumentId, null);
    return repo.findByDocumentId(clienteDocumentId);
  },

  async listNegociosForPicker(search?: string) {
    const repo = createClienteRepository(strapi);
    return repo.findNegociosForPicker(search);
  },

  async unsubscribeByToken(token: string) {
    const documentId = verifyUnsubscribeToken(token);
    if (!documentId) {
      throw new ValidationError('Enlace de baja inválido o alterado');
    }

    const repo = createClienteRepository(strapi);
    const cliente = await repo.findByDocumentId(documentId);
    if (!cliente) throw new NotFoundError('Cliente');

    if (cliente.opt_out) {
      return { ok: true, already: true, email: cliente.email };
    }

    await repo.update(documentId, { opt_out: true });
    await logActivity(
      strapi,
      'info',
      'Cliente opt-out',
      `Baja por link: ${cliente.email}`,
      undefined,
      undefined
    );

    return { ok: true, already: false, email: cliente.email };
  },

  async sendTestMail(input: {
    subject: string;
    bodyHtml: string;
    toEmail: string;
    adminUser?: any;
  }) {
    const subject = input.subject?.trim();
    const bodyHtml = input.bodyHtml?.trim();
    const toEmail = normalizeClienteEmail(input.toEmail);

    if (!subject || !bodyHtml || !toEmail) {
      throw new ValidationError('subject, bodyHtml y toEmail son obligatorios');
    }

    const repo = createClienteRepository(strapi);
    const matching = await repo.findByEmail(toEmail);
    const unsubscribeUrl = matching ? buildUnsubscribeUrl(matching.documentId) : undefined;

    const notifications = createNotificationService(strapi);
    const html = wrapClienteAvisosEmail(bodyHtml, { isTest: true, unsubscribeUrl });

    const ok = await notifications.sendEmail(
      { to: toEmail, subject: `[PRUEBA] ${subject}`, html },
      { throwOnError: true }
    );

    await logActivity(
      strapi,
      'info',
      'Mail prueba clientes',
      `Prueba a ${toEmail}: ${subject}`,
      undefined,
      input.adminUser
    );

    return { ok, to: toEmail, subject, hasUnsubscribeLink: Boolean(unsubscribeUrl) };
  },

  async sendBroadcast(input: {
    subject: string;
    bodyHtml: string;
    audience: BroadcastAudience;
    documentIds?: string[];
    adminUser?: any;
  }) {
    const subject = input.subject?.trim();
    const bodyHtml = input.bodyHtml?.trim();
    if (!subject || !bodyHtml) {
      throw new ValidationError('subject y bodyHtml son obligatorios');
    }

    const repo = createClienteRepository(strapi);
    const clientes = await repo.findMany({
      populate: false,
      fields: ['email', 'opt_out', 'documentId'],
      sort: ['email:asc'],
    });

    const recipients = filterBroadcastRecipients(
      clientes.map((c: any) => ({
        documentId: c.documentId,
        email: c.email,
        opt_out: c.opt_out,
      })),
      { audience: input.audience, documentIds: input.documentIds }
    );

    if (recipients.length === 0) {
      throw new ValidationError('No hay destinatarios (revisá opt-out o selección)');
    }

    const notifications = createNotificationService(strapi);

    const results: Array<{ email: string; ok: boolean }> = [];
    for (const recipient of recipients) {
      const html = wrapClienteAvisosEmail(bodyHtml, {
        isTest: false,
        unsubscribeUrl: buildUnsubscribeUrl(recipient.documentId),
      });
      const ok = await notifications.sendEmail({
        to: recipient.email,
        subject,
        html,
      });
      results.push({ email: recipient.email, ok });
      await sleep(120);
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;

    await logActivity(
      strapi,
      failed > 0 ? 'warning' : 'success',
      'Mail broadcast clientes',
      `Asunto: ${subject}. Enviados ${sent}/${results.length} (fallidos: ${failed})`,
      undefined,
      input.adminUser
    );

    return { total: results.length, sent, failed, results };
  },
}));
