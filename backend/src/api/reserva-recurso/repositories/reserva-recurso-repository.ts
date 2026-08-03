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

  async createMany(comercioDocumentId: string, nombres: string[]) {
    const created = [];
    for (let i = 0; i < nombres.length; i++) {
      const row = await this.strapi.documents('api::reserva-recurso.reserva-recurso').create({
        data: {
          nombre: nombres[i],
          orden: i + 1,
          activo: true,
          comercio: comercioDocumentId,
        },
      });
      created.push(row);
    }
    return created;
  }
}

export const createReservaRecursoRepository = (strapi: any) =>
  new ReservaRecursoRepository(strapi);
