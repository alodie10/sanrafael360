export class GuideSettingRepository {
  constructor(private readonly strapi: any) {}

  uid() {
    return 'api::guide-setting.guide-setting';
  }

  find() {
    return this.strapi.documents(this.uid()).findFirst();
  }

  async upsert(data: Record<string, unknown>) {
    const current = await this.find();
    if (current?.documentId) {
      return this.strapi.documents(this.uid()).update({ documentId: current.documentId, data });
    }
    return this.strapi.documents(this.uid()).create({ data });
  }
}

export const createGuideSettingRepository = (strapi: any) => new GuideSettingRepository(strapi);
