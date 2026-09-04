const PUBLIC_NEGOCIO_FIELDS = [
  'nombre',
  'slug',
  'direccion',
  'is_premium',
  'premium_valid_until',
  'price_range',
  'rating',
  'review_count',
  'google_rating',
  'google_review_count',
  'tripadvisor_rating',
  'tripadvisor_review_count',
  'reserva_url',
  'reserva_habilitada',
  'cta_link',
  'cta_habilitado',
];

const ADMIN_POPULATE = {
  encabezado: { fields: ['url', 'alternativeText', 'width', 'height'] },
  negocios: {
    fields: ['nombre', 'slug', 'documentId', 'is_premium', 'premium_valid_until'],
    populate: { categoria: { fields: ['nombre', 'slug'] } },
  },
};

const PUBLIC_POPULATE = {
  encabezado: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
  negocios: {
    fields: PUBLIC_NEGOCIO_FIELDS,
    populate: {
      categoria: { fields: ['nombre', 'slug'] },
      logo: { fields: ['url'] },
      imagen_portada: { fields: ['url'] },
      owner: { fields: ['id'] },
      ofertas: true,
    },
  },
};

export class EfemerideRepository {
  constructor(private readonly strapi: any) {}

  private docs() {
    return this.strapi.documents('api::efemeride.efemeride');
  }

  async findMany(status: 'published' | 'draft') {
    return this.docs().findMany({
      status,
      sort: ['nombre:asc'],
      populate: ADMIN_POPULATE,
      limit: -1,
    });
  }

  async findByDocumentId(documentId: string, status?: 'published' | 'draft') {
    const query: Record<string, unknown> = {
      documentId,
      populate: ADMIN_POPULATE,
    };
    if (status) query.status = status;
    return this.docs().findOne(query);
  }

  async findPublishedBySlug(slug: string) {
    const rows = await this.docs().findMany({
      filters: { slug: { $eq: slug } },
      status: 'published',
      populate: PUBLIC_POPULATE,
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async findPublishedList() {
    return this.docs().findMany({
      status: 'published',
      fields: ['nombre', 'slug', 'descripcion', 'vigente_desde', 'vigente_hasta'],
      populate: {
        encabezado: { fields: ['url', 'alternativeText', 'width', 'height'] },
      },
      sort: ['nombre:asc'],
      limit: -1,
    });
  }

  async update(documentId: string, data: Record<string, unknown>, status: 'draft' | 'published') {
    return this.docs().update({ documentId, data, status });
  }

  async findPremiumNegocios() {
    return this.strapi.documents('api::negocio.negocio').findMany({
      filters: { is_premium: { $eq: true } },
      fields: ['nombre', 'slug', 'documentId', 'is_premium', 'premium_valid_until'],
      populate: { categoria: { fields: ['nombre', 'slug'] } },
      sort: ['nombre:asc'],
      status: 'published',
      limit: -1,
    });
  }
}

export const createEfemerideRepository = (strapi: any) => new EfemerideRepository(strapi);
