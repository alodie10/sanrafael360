export class GuideMaterialRepository {
  constructor(private readonly strapi: any) {}

  uid() {
    return 'api::guide-material.guide-material';
  }

  findMany(filters: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
    return this.strapi.documents(this.uid()).findMany({
      filters,
      sort: extra.sort ?? ['updatedAt:desc'],
      limit: extra.limit ?? 80,
    });
  }

  findByDocumentId(documentId: string) {
    return this.strapi.documents(this.uid()).findOne({ documentId });
  }

  create(data: Record<string, unknown>) {
    return this.strapi.documents(this.uid()).create({ data });
  }

  update(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents(this.uid()).update({ documentId, data });
  }

  delete(documentId: string) {
    return this.strapi.documents(this.uid()).delete({ documentId });
  }
}

export const createGuideMaterialRepository = (strapi: any) => new GuideMaterialRepository(strapi);
