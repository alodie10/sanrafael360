type PagoEstado = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';

export type PagoRecord = {
  id: number;
  documentId: string;
  monto?: number | null;
  estado?: PagoEstado;
  mp_preference_id?: string | null;
  mp_payment_id?: string | null;
  external_reference?: string | null;
  fecha_pago?: string | Date | null;
  negocio?: number | { id: number } | null;
  detalles_mp?: unknown;
};

export type CreatePagoData = {
  monto: number;
  estado: PagoEstado;
  mp_preference_id?: string;
  mp_payment_id?: string;
  external_reference?: string;
  fecha_pago?: Date;
  negocio?: number;
  detalles_mp?: unknown;
  publishedAt?: Date;
};

export type UpdatePagoData = Partial<CreatePagoData>;

export type SuscripcionConfig = {
  modo_prueba?: boolean;
  precio_mensual?: number;
  precio_semestral?: number;
  dias_mensual?: number;
  dias_semestral?: number;
};

export class PagoRepository {
  constructor(private readonly strapi: any) {}

  async findSubscriptionConfig(): Promise<SuscripcionConfig | null> {
    return this.strapi.documents('api::suscripcion-config.suscripcion-config').findFirst();
  }

  async findByMpPaymentId(mpPaymentId: string, limit = 1): Promise<PagoRecord[]> {
    return this.strapi.documents('api::pago.pago').findMany({
      filters: { mp_payment_id: mpPaymentId },
      limit,
    });
  }

  async findApprovedByMpPaymentId(mpPaymentId: string): Promise<PagoRecord | null> {
    const rows = await this.strapi.documents('api::pago.pago').findMany({
      filters: { mp_payment_id: mpPaymentId, estado: 'aprobado' },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async findPendingByExternalReference(externalReference: string): Promise<PagoRecord | null> {
    const rows = await this.strapi.documents('api::pago.pago').findMany({
      filters: { external_reference: externalReference, estado: 'pendiente' },
      sort: 'createdAt:desc',
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async create(data: CreatePagoData) {
    return this.strapi.documents('api::pago.pago').create({ data });
  }

  async update(documentId: string, data: UpdatePagoData) {
    return this.strapi.documents('api::pago.pago').update({ documentId, data });
  }
}

export const createPagoRepository = (strapi: any) => new PagoRepository(strapi);
