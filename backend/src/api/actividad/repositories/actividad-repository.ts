export class ActividadRepository {
  constructor(private readonly strapi: any) {}

  async findMany(options: {
    filters?: Record<string, unknown>;
    sort?: string;
    limit?: number;
  }) {
    return (this.strapi.documents as any)('api::actividad.actividad').findMany({
      filters: options.filters ?? {},
      populate: {
        negocio: { fields: ['nombre', 'slug'] },
        usuario: { fields: ['username', 'email'] },
      },
      sort: options.sort ?? 'createdAt:desc',
      limit: options.limit ?? 50,
    });
  }
}

export const createActividadRepository = (strapi: any) => new ActividadRepository(strapi);
