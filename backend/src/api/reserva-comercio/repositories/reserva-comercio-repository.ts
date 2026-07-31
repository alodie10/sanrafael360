export class ReservaComercioRepository {
  constructor(private readonly strapi: any) {}

  async findBySlug(slug: string, populate?: any) {
    const rows = await this.strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
      filters: { slug: { $eq: slug } },
      limit: 1,
      populate:
        populate ??
        {
          logo: { fields: ['url'] },
          imagen_portada: { fields: ['url'] },
          recursos: { sort: ['orden:asc'] },
        },
    });
    return rows[0] ?? null;
  }

  async findByDocumentId(documentId: string, populate?: any) {
    return this.strapi.documents('api::reserva-comercio.reserva-comercio').findOne({
      documentId,
      populate:
        populate ??
        {
          logo: { fields: ['url'] },
          imagen_portada: { fields: ['url'] },
          recursos: { sort: ['orden:asc'] },
        },
    });
  }
}

export const createReservaComercioRepository = (strapi: any) =>
  new ReservaComercioRepository(strapi);
