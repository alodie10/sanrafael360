export type DailyStatRecord = {
  documentId: string;
  negocio_id: string;
  date: string;
  views?: number | null;
  clicks_whatsapp?: number | null;
  clicks_website?: number | null;
};

export type CreateDailyStatData = {
  negocio_id: string;
  date: string;
  views?: number;
  clicks_whatsapp?: number;
  clicks_website?: number;
};

export type UpdateDailyStatData = Partial<
  Pick<DailyStatRecord, 'views' | 'clicks_whatsapp' | 'clicks_website'>
>;

export type DailyStatFilters = {
  negocio_id?: string | { $in: string[] };
  date?: string | { $gte?: string; $lte?: string };
};

const UID = 'api::daily-stat.daily-stat';

export class DailyStatRepository {
  constructor(private readonly strapi: any) {}

  async count(): Promise<number> {
    return this.strapi.documents(UID).count({});
  }

  async findMany(filters: DailyStatFilters = {}, limit = -1): Promise<DailyStatRecord[]> {
    return this.strapi.documents(UID).findMany({ filters, limit });
  }

  async findByNegocioAndDate(negocioId: string, date: string): Promise<DailyStatRecord | null> {
    const rows = await this.strapi.documents(UID).findMany({
      filters: { negocio_id: negocioId, date },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async create(data: CreateDailyStatData, status: 'published' | 'draft' = 'published') {
    return this.strapi.documents(UID).create({ data, status });
  }

  async update(documentId: string, data: UpdateDailyStatData, status: 'published' | 'draft' = 'published') {
    return this.strapi.documents(UID).update({ documentId, data, status });
  }

  async delete(documentId: string) {
    return this.strapi.documents(UID).delete({ documentId });
  }

  async deleteAll(): Promise<number> {
    const existing = await this.findMany();
    for (const stat of existing) {
      await this.delete(stat.documentId);
    }
    return existing.length;
  }
}

export const createDailyStatRepository = (strapi: any) => new DailyStatRepository(strapi);
