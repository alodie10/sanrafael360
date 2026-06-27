import { syncNegocioToAlgolia } from '../../../negocio/services/algolia';

export default {
  async afterCreate(event: any) {
    const { result } = event;
    const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
      documentId: result.documentId,
      populate: ['negocio']
    });
    
    if (fullOferta && fullOferta.negocio) {
      const docId = fullOferta.negocio.documentId || fullOferta.negocio.id;
      if (docId) await syncNegocioToAlgolia(String(docId));
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;
    const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
      documentId: result.documentId,
      populate: ['negocio']
    });
    
    if (fullOferta && fullOferta.negocio) {
      const docId = fullOferta.negocio.documentId || fullOferta.negocio.id;
      if (docId) await syncNegocioToAlgolia(String(docId));
    }
  },

  async afterDelete(event: any) {
    const { result } = event;
    // In afterDelete, result might not have relations populated anymore if it was deleted.
    // However, if the frontend sends the payload or it was pre-populated, it might exist.
    if (result.negocio) {
      const docId = result.negocio.documentId || result.negocio.id;
      if (docId) await syncNegocioToAlgolia(String(docId));
    }
  }
};
