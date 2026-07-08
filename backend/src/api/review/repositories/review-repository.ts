export class ReviewRepository {
  constructor(private readonly strapi: any) {}

  async findOneWithAutor(documentId: string) {
    return this.strapi.documents('api::review.review').findOne({
      documentId,
      populate: ['autor'],
    });
  }

  async findRatingsByNegocio(negocioDocumentId: string) {
    return this.strapi.documents('api::review.review').findMany({
      filters: { negocio: { documentId: negocioDocumentId } },
      fields: ['rating'],
      limit: -1,
    });
  }

  async create(data: {
    rating: number;
    comentario: string;
    negocio: string;
    autor: number;
  }) {
    return this.strapi.documents('api::review.review').create({
      data,
      status: 'published',
    });
  }
}

export const createReviewRepository = (strapi: any) => new ReviewRepository(strapi);
