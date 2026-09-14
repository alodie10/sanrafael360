export class OfertaRepository {
  constructor(private readonly strapi: any) {}

  async findDatesByDocumentId(documentId: string) {
    return this.strapi.documents('api::oferta.oferta').findOne({
      documentId,
      fields: ['valida_desde', 'valida_hasta', 'activa'],
      status: 'published',
    });
  }

  async findPublishedForVigencia() {
    return this.strapi.documents('api::oferta.oferta').findMany({
      status: 'published',
      fields: ['documentId', 'activa', 'valida_desde', 'valida_hasta'],
      limit: -1,
    });
  }

  async updateActiva(documentId: string, activa: boolean) {
    return this.strapi.documents('api::oferta.oferta').update({
      documentId,
      data: { activa },
      status: 'published',
    });
  }
}

export const createOfertaRepository = (strapi: any) => new OfertaRepository(strapi);
