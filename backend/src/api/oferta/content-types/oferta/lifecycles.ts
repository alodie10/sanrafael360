import { syncNegocioToAlgolia } from '../../../negocio/services/algolia';

export default {
  async afterCreate(event: any) {
    const negocioId = event.params.data?.negocio;
    if (negocioId) {
      await syncNegocioToAlgolia(String(negocioId));
    }
  },

  async afterUpdate(event: any) {
    // Si el negocio viene en el payload, usamos ese
    let negocioId = event.params.data?.negocio;
    
    // Si no viene en el payload, lo buscamos en la DB (en estado draft)
    if (!negocioId) {
      const { result } = event;
      if (result && result.documentId) {
        const fullOferta = await strapi.documents('api::oferta.oferta').findOne({
          documentId: result.documentId,
          populate: ['negocio'],
          status: 'draft'
        });
        if (fullOferta?.negocio) {
          negocioId = fullOferta.negocio.documentId || fullOferta.negocio.id;
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
        documentId: documentId,
        populate: ['negocio'],
        status: 'published'
      }) || await strapi.documents('api::oferta.oferta').findOne({
        documentId: documentId,
        populate: ['negocio'],
        status: 'draft'
      });

      if (fullOferta && fullOferta.negocio) {
        event.state.negocioId = fullOferta.negocio.documentId || fullOferta.negocio.id;
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
