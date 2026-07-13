export class FeedRepository {
  constructor(private readonly strapi: any) {}

  async findPremiumNegocios() {
    return this.strapi.documents('api::negocio.negocio').findMany({
      filters: { is_premium: true },
      status: 'published',
      populate: ['logo', 'imagen_portada', 'categoria', 'ofertas'],
      limit: -1,
    });
  }

  async findActiveOfertas(nowIso: string) {
    return this.strapi.documents('api::oferta.oferta').findMany({
      filters: {
        activa: true,
        valida_hasta: { $gte: nowIso },
      },
      status: 'published',
      populate: {
        negocio: {
          populate: ['imagen_portada', 'logo', 'categoria'],
        },
      },
      limit: -1,
    });
  }
}

export const createFeedRepository = (strapi: any) => new FeedRepository(strapi);
