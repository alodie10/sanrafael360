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

  async findByNegocioDocumentId(negocioDocumentId: string) {
    const rows = await this.strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
      filters: { negocio: { documentId: { $eq: negocioDocumentId } } },
      limit: 1,
      fields: ['slug', 'nombre', 'documentId'],
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

  /** Campos de token MP para resolver access tokens en webhooks. */
  async listMpTokenSources(limit = 200) {
    return this.strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
      filters: { activo: { $ne: false } },
      fields: ['slug', 'mp_access_token_enc', 'mp_token_env'],
      limit,
    });
  }

  async create(data: Record<string, unknown>) {
    return this.strapi.documents('api::reserva-comercio.reserva-comercio').create({ data });
  }

  async update(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents('api::reserva-comercio.reserva-comercio').update({
      documentId,
      data,
    });
  }

  async uploadFile(documentId: string, field: 'logo' | 'imagen_portada', files: any) {
    const uploadedFiles = await this.strapi.plugin('upload').service('upload').upload({
      data: {},
      files,
    });
    if (!uploadedFiles?.length) {
      throw new Error('Upload returned no files');
    }
    await this.update(documentId, { [field]: uploadedFiles[0].id });
    return uploadedFiles;
  }
}

export const createReservaComercioRepository = (strapi: any) =>
  new ReservaComercioRepository(strapi);
