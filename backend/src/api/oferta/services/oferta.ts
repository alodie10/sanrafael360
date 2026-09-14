import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { createOfertaRepository } from '../repositories/oferta-repository';
import { assertCanPublishListing } from '../../../utils/negocio-acl';
import { resolveAdminUser } from '../../../utils/admin-access';
import {
  mergePublicVigenciaFilters,
  planVigenciaUpdates,
  stampActivaOnPayload,
} from './oferta-vigencia';

async function loadCaller(strapi: any, user: { id: number } | undefined) {
  if (!user?.id) throw new ForbiddenError('Debes iniciar sesión');
  const full = await resolveAdminUser(strapi, user);
  if (!full) throw new ForbiddenError('Debes iniciar sesión');
  return full;
}

async function loadOwnedNegocio(strapi: any, negocioId: string, user: any) {
  const repo = createNegocioRepository(strapi);
  const negocio = await repo.findById(negocioId, ['owner']);
  if (!negocio) throw new NotFoundError('Negocio');
  assertCanPublishListing(user, negocio);
  return negocio;
}

export default factories.createCoreService('api::oferta.oferta', ({ strapi }) => ({
  async createForOwner(user: { id: number }, data: Record<string, any>) {
    const caller = await loadCaller(strapi, user);
    const negocioId = data?.negocio;
    if (!negocioId || typeof negocioId !== 'string') {
      throw new ValidationError('negocio es requerido');
    }
    await loadOwnedNegocio(strapi, negocioId, caller);

    const payload: Record<string, any> = { ...data, negocio: negocioId };
    stampActivaOnPayload(payload);
    return strapi.documents('api::oferta.oferta').create({
      data: payload as any,
      status: 'published',
    });
  },

  async updateForOwner(user: { id: number }, documentId: string, data: Record<string, any>) {
    const caller = await loadCaller(strapi, user);
    const existing = await strapi.documents('api::oferta.oferta').findOne({
      documentId,
      populate: { negocio: { populate: ['owner'] } },
    });
    if (!existing) throw new NotFoundError('Oferta');

    const negocio = existing.negocio;
    if (!negocio?.documentId) throw new ForbiddenError('La oferta no pertenece a un negocio');
    await loadOwnedNegocio(strapi, negocio.documentId, caller);

    if (data.negocio && data.negocio !== negocio.documentId) {
      throw new ForbiddenError('No puedes mover la oferta a otro negocio');
    }

    const { negocio: _ignored, ...rest } = data;
    stampActivaOnPayload(rest, existing);
    return strapi.documents('api::oferta.oferta').update({
      documentId,
      data: rest,
      status: 'published',
    });
  },

  async deleteForOwner(user: { id: number }, negocioId: string, ofertaId: string) {
    const caller = await loadCaller(strapi, user);
    await loadOwnedNegocio(strapi, negocioId, caller);

    const existing = await strapi.documents('api::oferta.oferta').findOne({
      documentId: ofertaId,
      populate: { negocio: { fields: ['documentId'] } },
    });
    if (!existing) throw new NotFoundError('Oferta');
    if (existing.negocio?.documentId !== negocioId) {
      throw new ForbiddenError('La oferta no pertenece a este negocio');
    }

    await strapi.documents('api::oferta.oferta').delete({ documentId: ofertaId });
    return { success: true };
  },

  buildPublicFilters(filters: unknown, now: Date = new Date()) {
    return mergePublicVigenciaFilters(filters, now);
  },

  async syncVigencia(now: Date = new Date()) {
    const repo = createOfertaRepository(strapi);
    const ofertas = await repo.findPublishedForVigencia();
    const updates = planVigenciaUpdates(ofertas || [], now);
    for (const update of updates) {
      await repo.updateActiva(update.documentId, update.activa);
    }
    return {
      checked: (ofertas || []).length,
      activated: updates.filter((row) => row.activa).length,
      deactivated: updates.filter((row) => !row.activa).length,
    };
  },
}));
