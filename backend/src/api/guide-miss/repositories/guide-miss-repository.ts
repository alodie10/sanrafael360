export class GuideMissRepository {
  constructor(private readonly strapi: any) {}

  uid() {
    return 'api::guide-miss.guide-miss';
  }

  findMany(filters: Record<string, unknown>, extra: Record<string, unknown> = {}) {
    return this.strapi.documents(this.uid()).findMany({
      filters,
      sort: extra.sort ?? ['last_seen_at:desc'],
      limit: extra.limit ?? 100,
      start: extra.start ?? 0,
    });
  }

  findPendingByNorm(queryNorm: string) {
    return this.strapi.documents(this.uid()).findMany({
      filters: { query_norm: { $eq: queryNorm }, estado: { $eq: 'pendiente' } },
      limit: 1,
    }).then((rows: any[]) => rows[0] ?? null);
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
}

export const createGuideMissRepository = (strapi: any) => new GuideMissRepository(strapi);
