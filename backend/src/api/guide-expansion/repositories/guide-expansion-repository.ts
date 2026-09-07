export class GuideExpansionRepository {
  constructor(private readonly strapi: any) {}

  uid() {
    return 'api::guide-expansion.guide-expansion';
  }

  findMany(filters: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
    return this.strapi.documents(this.uid()).findMany({
      filters,
      sort: ['key:asc'],
      limit: extra.limit ?? 200,
      ...extra,
    });
  }

  findByKey(key: string) {
    return this.strapi.documents(this.uid()).findMany({
      filters: { key: { $eqi: key } },
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

  async count() {
    try {
      return await this.strapi.documents(this.uid()).count({});
    } catch {
      const rows = await this.findMany({}, { limit: 1 });
      return Array.isArray(rows) ? rows.length : 0;
    }
  }
}

export const createGuideExpansionRepository = (strapi: any) => new GuideExpansionRepository(strapi);
