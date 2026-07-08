import { factories } from '@strapi/strapi';
import { createReviewRepository } from '../repositories/review-repository';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

function computeRatingStats(reviews: Array<{ rating?: number }>) {
  const count = reviews.length;
  const sum = reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
  const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;
  return { count, average };
}

export default factories.createCoreService('api::review.review', ({ strapi }) => ({
  async enrichWithAutorUsername(reviews: Array<{ documentId: string; autor?: unknown }>) {
    const repo = createReviewRepository(strapi);

    return Promise.all(
      reviews.map(async (review) => {
        const fullReview = await repo.findOneWithAutor(review.documentId);
        if (fullReview?.autor) {
          review.autor = { username: (fullReview.autor as any).username };
        }
        return review;
      })
    );
  },

  async createReviewForUser(
    user: { id: number; documentId?: string },
    data: { rating: number; comentario: string; negocio: string }
  ) {
    const reviewRepo = createReviewRepository(strapi);
    const negocioRepo = createNegocioRepository(strapi);

    const negocio = await negocioRepo.findById(data.negocio, ['owner']);
    if (negocio) {
      const ownerId = (negocio.owner as any)?.documentId || (negocio.owner as any)?.id;
      const currentUserId = user.documentId || user.id;

      if (ownerId && String(ownerId) === String(currentUserId)) {
        throw new ValidationError('No puedes dejar una reseña en tu propio negocio.');
      }
    }

    const newReview = await reviewRepo.create({
      rating: Number(data.rating),
      comentario: data.comentario,
      negocio: data.negocio,
      autor: user.id,
    });

    await this.syncNegocioRating(data.negocio);

    return newReview;
  },

  async syncNegocioRating(negocioDocumentId: string) {
    const reviewRepo = createReviewRepository(strapi);
    const negocioRepo = createNegocioRepository(strapi);

    const negocio = await negocioRepo.findById(negocioDocumentId);
    if (!negocio) throw new NotFoundError('Negocio');

    const allReviews = await reviewRepo.findRatingsByNegocio(negocioDocumentId);
    const { count, average } = computeRatingStats(allReviews);

    strapi.log.info(`[Review-Sync] Negocio ${negocioDocumentId}: ${average} estrellas, ${count} reseñas.`);

    await negocioRepo.update(negocioDocumentId, {
      rating: average,
      review_count: count,
    });
  },
}));
