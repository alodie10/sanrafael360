export class LeadRepository {
  constructor(private readonly strapi: any) {}

  async findByDocumentId(documentId: string) {
    return this.strapi.documents('api::lead.lead').findOne({ documentId });
  }

  async listForAdmin(query: Record<string, any> = {}) {
    const estado = query?.filters?.estado?.$eq;
    const requested = Number(query?.pagination?.limit);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 100;
    const filters = estado ? { estado } : undefined;
    const data = await this.strapi.documents('api::lead.lead').findMany({
      filters,
      sort: 'createdAt:desc',
      limit,
      populate: { negocio_vinculado: { fields: ['nombre'] } },
    });
    const total = await this.strapi.documents('api::lead.lead').count({ filters });
    return { data, meta: { pagination: { total } } };
  }

  async updateEstado(documentId: string, estado: string) {
    return this.strapi.documents('api::lead.lead').update({
      documentId,
      data: { estado },
    });
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
