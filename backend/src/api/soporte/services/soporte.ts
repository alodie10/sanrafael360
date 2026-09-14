import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError } from '../../../utils/errors';

const ALLOWED_ESTADOS = new Set(['pendiente', 'respondido']);

export default factories.createCoreService('api::soporte.soporte' as any, ({ strapi }) => ({
  async createFromUser(
    user: { id: number; email?: string; username?: string },
    body: { asunto?: string; mensaje?: string; nombre?: string; negocio?: string }
  ) {
    return strapi.documents('api::soporte.soporte').create({
      data: {
        asunto: String(body.asunto || '').trim(),
        mensaje: String(body.mensaje || '').trim(),
        nombre: String(body.nombre || user.username || 'Usuario').trim(),
        email: user.email,
        estado: 'pendiente',
        usuario: user.id,
        ...(body.negocio ? { negocio: body.negocio } : {}),
      },
    });
  },

  async listForAdmin(query: Record<string, any> = {}) {
    const estado = query?.filters?.estado?.$eq;
    const requested = Number(query?.pagination?.limit);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 100;
    const filters = estado ? { estado } : undefined;
    const uid = 'api::soporte.soporte' as const;
    const data = await strapi.documents(uid).findMany({
      filters,
      sort: 'createdAt:desc',
      limit,
      populate: {
        usuario: { fields: ['username', 'email'] },
        negocio: { fields: ['nombre', 'slug'] },
      },
    });
    const total = await strapi.documents(uid).count({ filters });
    return { data, meta: { pagination: { total } } };
  },

  async replyAsAdmin(documentId: string, respuesta: string) {
    const trimmed = String(respuesta || '').trim();
    if (!trimmed) throw new ValidationError('respuesta es requerida');

    const existing = await strapi.documents('api::soporte.soporte').findOne({ documentId });
    if (!existing) throw new NotFoundError('Ticket de soporte');

    return strapi.documents('api::soporte.soporte').update({
      documentId,
      data: {
        respuesta: trimmed,
        estado: 'respondido',
      },
    });
  },
}));
