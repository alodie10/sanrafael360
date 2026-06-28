import { syncNegocioToAlgolia } from '../../../negocio/services/algolia';

function extractNegocioId(data: any): string | null {
  if (!data?.negocio) return null;
  if (typeof data.negocio === 'string') return data.negocio;
  if (data.negocio.connect && Array.isArray(data.negocio.connect) && data.negocio.connect.length > 0) {
    return data.negocio.connect[0].documentId || data.negocio.connect[0].id || null;
  }
  if (data.negocio.documentId) return data.negocio.documentId;
  if (data.negocio.id) return data.negocio.id;
  return null;
}

export default {
  async afterCreate(event: any) {
    const { result } = event;
    const documentId = result?.documentId;
    
    // En Strapi 5, usamos la Document Service API para auto-publicar
    if (documentId) {
      try {
        await strapi.documents('api::oferta.oferta').publish({
          documentId: String(documentId),
        });
      } catch (err) {
        strapi.log.error('Error auto-publishing oferta:', err);
      }
    }

    const negocioId = extractNegocioId(event.params.data);
    if (negocioId) {
      await syncNegocioToAlgolia(String(negocioId));
    }
  },

  async afterUpdate(event: any) {
    let negocioId = extractNegocioId(event.params.data);
    
    if (!negocioId) {
      const { result } = event;
      if (result && result.documentId) {
        const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
          documentId: String(result.documentId),
          populate: ['negocio']
        });
        
        if (fullOferta && fullOferta.negocio) {
          negocioId = String(fullOferta.negocio.documentId || fullOferta.negocio.id);
        }
      }
    }

    if (negocioId) {
      await syncNegocioToAlgolia(String(negocioId));
    }
  },

  async beforeDelete(event: any) {
    const documentId = event.params.where?.documentId || event.params.where?.id;
    if (documentId) {
      const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
        documentId: String(documentId),
        populate: ['negocio']
      });

      if (fullOferta && fullOferta.negocio) {
        event.state.negocioId = String(fullOferta.negocio.documentId || fullOferta.negocio.id);
      }
    }
  },

  async afterDelete(event: any) {
    const negocioId = event.state?.negocioId;
    if (negocioId) {
      await syncNegocioToAlgolia(String(negocioId));
    }
  }
};
