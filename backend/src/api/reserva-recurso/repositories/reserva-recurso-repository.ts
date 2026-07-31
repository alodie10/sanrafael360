export class ReservaRecursoRepository {
  constructor(private readonly strapi: any) {}

  async findActiveByComercio(comercioDocumentId: string) {
    return this.strapi.documents('api::reserva-recurso.reserva-recurso').findMany({
      filters: {
        activo: { $eq: true },
        comercio: { documentId: { $eq: comercioDocumentId } },
      },
      sort: ['orden:asc'],
    });
  }
}

export const createReservaRecursoRepository = (strapi: any) =>
  new ReservaRecursoRepository(strapi);
