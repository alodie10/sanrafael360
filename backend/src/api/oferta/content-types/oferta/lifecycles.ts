import { syncNegocioToAlgolia } from '../../../negocio/services/algolia';

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

// Guarda los documentIds que estamos publicando para evitar loops afterCreate -> publish -> afterUpdate -> publish
const publishingSet = new Set<string>();

export default {
  async afterCreate(event: any) {
    const { result } = event;
    const documentId = result?.documentId ? String(result.documentId) : null;
    const negocioId = extractNegocioId(event.params.data);

    // Fire-and-forget: retornamos inmediatamente al portal y procesamos en background
    setImmediate(async () => {
      if (documentId && !publishingSet.has(documentId)) {
        publishingSet.add(documentId);
        try {
          await strapi.documents('api::oferta.oferta').publish({ documentId });
          strapi.log.info(`[Oferta Lifecycle] Oferta ${documentId} publicada automáticamente.`);
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error al auto-publicar:', err);
        } finally {
          publishingSet.delete(documentId);
        }
      }

      // Intentamos obtener el negocioId del payload primero, si no, lo buscamos en DB
      let resolvedNegocioId = negocioId;
      if (!resolvedNegocioId && documentId) {
        try {
          const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
            documentId,
            populate: ['negocio'],
          });
          if (fullOferta?.negocio) {
            resolvedNegocioId = String(fullOferta.negocio.documentId || fullOferta.negocio.id);
          }
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error resolving negocio after create:', err);
        }
      }

      if (resolvedNegocioId) {
        try {
          await syncNegocioToAlgolia(resolvedNegocioId);
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error syncing Algolia after create:', err);
        }
      }
    });
  },

  async afterUpdate(event: any) {
    const { result } = event;
    const documentId = result?.documentId ? String(result.documentId) : null;

    // Si este update fue disparado por nuestro propio publish(), lo ignoramos
    if (documentId && publishingSet.has(documentId)) {
      return;
    }

    let negocioId = extractNegocioId(event.params.data);

    if (!negocioId && result?.documentId) {
      try {
        const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
          documentId: String(result.documentId),
          populate: ['negocio'],
        });
        if (fullOferta?.negocio) {
          negocioId = String(fullOferta.negocio.documentId || fullOferta.negocio.id);
        }
      } catch (err) {
        strapi.log.error('[Oferta Lifecycle] Error fetching negocio in afterUpdate:', err);
      }
    }

    if (negocioId) {
      const nId = negocioId;
      setImmediate(async () => {
        try {
          await syncNegocioToAlgolia(nId);
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error syncing Algolia after update:', err);
        }
      });
    }
  },

  async beforeDelete(event: any) {
    const documentId = event.params.where?.documentId || event.params.where?.id;
    if (documentId) {
      try {
        const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
          documentId: String(documentId),
          populate: ['negocio'],
        });
        if (fullOferta?.negocio) {
          event.state.negocioId = String(fullOferta.negocio.documentId || fullOferta.negocio.id);
        }
      } catch (err) {
        strapi.log.error('[Oferta Lifecycle] Error fetching negocio in beforeDelete:', err);
      }
    }
  },

  async afterDelete(event: any) {
    const negocioId = event.state?.negocioId;
    if (negocioId) {
      const nId = String(negocioId);
      setImmediate(async () => {
        try {
          await syncNegocioToAlgolia(nId);
        } catch (err) {
          strapi.log.error('[Oferta Lifecycle] Error syncing Algolia after delete:', err);
        }
      });
    }
  }
};
