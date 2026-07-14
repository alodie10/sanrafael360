export class ClienteRepository {
  constructor(private readonly strapi: any) {}

  async findMany(params: { populate?: any; sort?: string[]; fields?: string[] } = {}) {
    const query: Record<string, unknown> = {
      sort: params.sort ?? ['nombre:asc'],
    };
    if (params.fields) query.fields = params.fields;
    if (params.populate === false) {
      // sin populate
    } else {
      query.populate = params.populate ?? {
        negocios: { fields: ['nombre', 'slug', 'documentId'] },
      };
    }
    return this.strapi.documents('api::cliente.cliente').findMany(query);
  }

  async findByDocumentId(documentId: string, populate?: any) {
    return this.strapi.documents('api::cliente.cliente').findOne({
      documentId,
      populate: populate ?? { negocios: { fields: ['nombre', 'slug', 'documentId'] } },
    });
  }

  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const rows = await this.strapi.documents('api::cliente.cliente').findMany({
      filters: { email: { $eqi: normalized } },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async create(data: {
    email: string;
    nombre: string;
    notas?: string;
    opt_out?: boolean;
  }) {
    return this.strapi.documents('api::cliente.cliente').create({ data });
  }

  async update(
    documentId: string,
    data: Partial<{ email: string; nombre: string; notas: string; opt_out: boolean }>
  ) {
    return this.strapi.documents('api::cliente.cliente').update({ documentId, data });
  }

  async delete(documentId: string) {
    return this.strapi.documents('api::cliente.cliente').delete({ documentId });
  }

  async setNegocioCliente(negocioDocumentId: string, clienteDocumentId: string | null) {
    return this.strapi.documents('api::negocio.negocio').update({
      documentId: negocioDocumentId,
      data: { cliente: clienteDocumentId },
    });
  }

  async findNegociosForPicker(search?: string) {
    const filters: any = {};
    if (search?.trim()) {
      filters.nombre = { $containsi: search.trim() };
    }
    return this.strapi.documents('api::negocio.negocio').findMany({
      filters,
      fields: ['nombre', 'slug', 'documentId', 'email'],
      populate: { cliente: { fields: ['email', 'nombre', 'documentId'] } },
      sort: ['nombre:asc'],
      limit: 50,
      status: 'published',
    });
  }
}

export const createClienteRepository = (strapi: any) => new ClienteRepository(strapi);
