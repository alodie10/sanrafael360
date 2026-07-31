export class ReservaBloqueoRepository {
  constructor(private readonly strapi: any) {}

  async findInRange(params: {
    comercioDocumentId: string;
    rangeStart: string;
    rangeEnd: string;
  }) {
    return this.strapi.documents('api::reserva-bloqueo.reserva-bloqueo').findMany({
      filters: {
        comercio: { documentId: { $eq: params.comercioDocumentId } },
        inicio: { $lt: params.rangeEnd },
        fin: { $gt: params.rangeStart },
      },
      populate: { recurso: true },
    });
  }
}

export const createReservaBloqueoRepository = (strapi: any) =>
  new ReservaBloqueoRepository(strapi);
