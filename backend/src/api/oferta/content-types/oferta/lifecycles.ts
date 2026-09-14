import { syncNegocioToAlgolia } from '../../../negocio/services/algolia';
import { createOfertaRepository } from '../../repositories/oferta-repository';
import { shouldAutoPublish, stampActivaOnPayload } from '../../services/oferta-vigencia';

const publishingSet = new Set<string>();
const algoliaQueued = new Set<string>();

async function stampActivaFromDates(event: any, isUpdate: boolean) {
  const data = event.params?.data;
  if (!data || typeof data !== 'object') return;
  let existing = null;
  if (isUpdate && (data.valida_desde == null || data.valida_hasta == null)) {
    const documentId = event.params?.where?.documentId || event.params?.where?.id;
    if (documentId) {
      existing = await createOfertaRepository(strapi).findDatesByDocumentId(String(documentId));
    }
  }
  stampActivaOnPayload(data, existing);
}

function extractNegocioId(data: any): string | null {
  if (!data?.negocio) return null;
  if (typeof data.negocio === 'string') return data.negocio;
  if (data.negocio.connect && Array.isArray(data.negocio.connect) && data.negocio.connect.length > 0) {
    const first = data.negocio.connect[0];
    return String(first.documentId || first.id || '');
  }
  if (data.negocio.documentId) return String(data.negocio.documentId);
  if (data.negocio.id) return String(data.negocio.id);
  return null;
}

function scheduleAlgoliaSync(negocioId: string | null) {
  if (!negocioId || algoliaQueued.has(negocioId)) return;
  algoliaQueued.add(negocioId);
  setImmediate(async () => {
    try {
      await syncNegocioToAlgolia(negocioId);
    } catch (err) {
      strapi.log.error('[Oferta Lifecycle] Error syncing Algolia:', err);
    } finally {
      algoliaQueued.delete(negocioId);
    }
  });
}

async function resolveNegocioId(documentId: string | null, fromPayload: string | null) {
  if (fromPayload) return fromPayload;
  if (!documentId) return null;
  try {
    const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
      documentId,
      populate: ['negocio'],
    });
    if (fullOferta?.negocio) {
      return String(fullOferta.negocio.documentId || fullOferta.negocio.id);
    }
  } catch (err) {
    strapi.log.error('[Oferta Lifecycle] Error resolving negocio:', err);
  }
  return null;
}

export default {
  async beforeCreate(event: any) {
    await stampActivaFromDates(event, false);
  },

  async beforeUpdate(event: any) {
    await stampActivaFromDates(event, true);
  },

  async afterCreate(event: any) {
    const { result } = event;
    const documentId = result?.documentId ? String(result.documentId) : null;
    if (documentId && publishingSet.has(documentId)) return;

    if (documentId && shouldAutoPublish(result, publishingSet)) {
      publishingSet.add(documentId);
      setImmediate(async () => {
        try {
          await strapi.documents('api::oferta.oferta').publish({ documentId });
          strapi.log.info(`[Oferta Lifecycle] Oferta ${documentId} publicada automáticamente.`);
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error al auto-publicar:', err);
        } finally {
          publishingSet.delete(documentId);
        }
      });
    }

    const payloadNegocioId = extractNegocioId(event.params.data);
    setImmediate(async () => {
      scheduleAlgoliaSync(await resolveNegocioId(documentId, payloadNegocioId));
    });
  },

  async afterUpdate(event: any) {
    const { result } = event;
    const documentId = result?.documentId ? String(result.documentId) : null;
    if (documentId && publishingSet.has(documentId)) return;

    const payloadNegocioId = extractNegocioId(event.params.data);
    setImmediate(async () => {
      scheduleAlgoliaSync(await resolveNegocioId(documentId, payloadNegocioId));
    });
  },

  async beforeDelete(event: any) {
    const documentId = event.params.where?.documentId || event.params.where?.id;
    if (documentId) {
      event.state.negocioId = await resolveNegocioId(String(documentId), null);
    }
  },

  async afterDelete(event: any) {
    const negocioId = event.state?.negocioId ? String(event.state.negocioId) : null;
    scheduleAlgoliaSync(negocioId);
  },
};
