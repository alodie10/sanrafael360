export class ReservaRepository {
  constructor(private readonly strapi: any) {}

  async findByDocumentId(documentId: string, populate?: any) {
    return this.strapi.documents('api::reserva.reserva').findOne({
      documentId,
      populate: populate ?? {
        comercio: true,
        recurso: true,
      },
    });
  }

  async findByCodigo(codigo: string, populate?: any) {
    const rows = await this.strapi.documents('api::reserva.reserva').findMany({
      filters: { codigo: { $eq: codigo } },
      limit: 1,
      populate: populate ?? { comercio: true, recurso: true },
    });
    return rows[0] ?? null;
  }

  async findByMpPaymentId(mpPaymentId: string) {
    const rows = await this.strapi.documents('api::reserva.reserva').findMany({
      filters: { mp_payment_id: { $eq: String(mpPaymentId) } },
      limit: 1,
      populate: { comercio: true, recurso: true },
    });
    return rows[0] ?? null;
  }

  async create(data: Record<string, unknown>) {
    return this.strapi.documents('api::reserva.reserva').create({ data });
  }

  async update(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents('api::reserva.reserva').update({ documentId, data });
  }

  async findOccupyingInRange(params: {
    comercioDocumentId: string;
    recursoDocumentId?: string;
    rangeStart: string;
    rangeEnd: string;
  }) {
    const filters: Record<string, unknown> = {
      comercio: { documentId: { $eq: params.comercioDocumentId } },
      estado: { $in: ['hold', 'confirmada'] },
      inicio: { $lt: params.rangeEnd },
      fin: { $gt: params.rangeStart },
    };
    if (params.recursoDocumentId) {
      filters.recurso = { documentId: { $eq: params.recursoDocumentId } };
    }
    return this.strapi.documents('api::reserva.reserva').findMany({
      filters,
      populate: { recurso: true },
    });
  }
}

export const createReservaRepository = (strapi: any) => new ReservaRepository(strapi);
