export class LeadRepository {
  constructor(private readonly strapi: any) {}

  async findByDocumentId(documentId: string) {
    return this.strapi.documents('api::lead.lead').findOne({ documentId });
  }

  async markConverted(leadDocumentId: string, negocioDocumentId: string) {
    return this.strapi.documents('api::lead.lead').update({
      documentId: leadDocumentId,
      data: {
        estado: 'convertido',
        negocio_vinculado: negocioDocumentId,
      },
    });
  }
}

export const createLeadRepository = (strapi: any) => new LeadRepository(strapi);
