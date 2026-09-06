import { Core } from '@strapi/strapi';

export class NegocioRepository {
  private strapi: any;

  constructor(strapi: any) {
    this.strapi = strapi;
  }

  async findById(
    documentId: string,
    populate: string[] = [],
    status?: 'draft' | 'published'
  ) {
    return await this.strapi.documents('api::negocio.negocio').findOne({
      documentId,
      populate,
      ...(status ? { status } : {}),
    });
  }

  async findByOwner(userId: number, populate: any[] | string[] = []) {
    // Mismo shape de filtro que getPortalStats (`owner: userId`).
    // `owner: { id: { $eq } }` a veces no resuelve el link oneToOne en Document Service.
    return await this.strapi.documents('api::negocio.negocio').findMany({
      filters: {
        owner: userId,
      },
      populate,
      fields: [
        'nombre',
        'slug',
        'descripcion',
        'is_premium',
        'premium_valid_until',
        'estado_reclamo',
        'documentId',
      ],
      status: 'published',
    });
  }

  async update(documentId: string, data: any) {
    return await this.strapi.documents('api::negocio.negocio').update({
      documentId,
      data,
    });
  }

  async updateDraftAndPublished(documentId: string, data: any) {
    await this.strapi.documents('api::negocio.negocio').update({
      documentId,
      data,
      status: 'draft',
    });
    return this.strapi.documents('api::negocio.negocio').update({
      documentId,
      data,
      status: 'published',
    });
  }

  async publish(documentId: string) {
    return await this.strapi.documents('api::negocio.negocio').publish({
      documentId,
    });
  }

  async findPendingClaims(populate: string[] = []) {
    // Buscamos en 'draft' porque los reclamos nuevos o actualizaciones de publicados
    // viven en el estado borrador hasta ser aprobados/publicados.
    return await this.strapi.documents('api::negocio.negocio').findMany({
      filters: {
        estado_reclamo: 'pendiente',
      },
      populate,
      status: 'draft',
    });
  }

  async uploadFile(documentId: string, field: string, files: any, isMultiple: boolean = false) {
    this.strapi.log.info(`[Repo] Uploading file for ${field} on documentId ${documentId} (isMultiple: ${isMultiple})`);
    try {
      const uploadedFiles = await this.strapi.plugin('upload').service('upload').upload({
        data: {}, // Pure upload
        files,
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Upload returned no files');
      }

      const newFileIds = uploadedFiles.map((f: any) => f.id);
      this.strapi.log.info(`[Repo] Files uploaded (IDs: ${newFileIds.join(', ')}). Linking to document...`);

      let finalMediaValue: any;

      if (isMultiple) {
        // Fetch existing entries to append
        const existing = await this.findById(documentId, [field]);
        const existingIds = (existing[field] || []).map((f: any) => f.id);
        finalMediaValue = [...existingIds, ...newFileIds];
      } else {
        finalMediaValue = newFileIds[0];
      }

      await this.strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          [field]: finalMediaValue,
        },
      });

      this.strapi.log.info(`[Repo] Media link successful for field ${field}`);
      return uploadedFiles;
    } catch (err: any) {
      this.strapi.log.error(`[Repo] Upload/Link error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Negocios con Place ID cuya cache de reseñas nunca se syncó o tiene más de `staleDays`.
   */
  async findNeedingGoogleReviewsSync(staleDays = 30, limit = 100) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);
    const cutoffIso = cutoff.toISOString();

    return this.strapi.documents('api::negocio.negocio').findMany({
      filters: {
        is_premium: { $eq: true },
        google_place_id: { $notNull: true },
        $or: [
          { google_reviews_synced_at: { $null: true } },
          { google_reviews_synced_at: { $lt: cutoffIso } },
        ],
      },
      fields: ['documentId', 'nombre', 'google_place_id', 'google_reviews_synced_at', 'is_premium'],
      limit,
      status: 'published',
    });
  }

  async saveGoogleReviewsCache(
    documentId: string,
    data: {
      google_reviews: unknown;
      google_reviews_synced_at: string;
      google_rating?: number;
      google_review_count?: number;
    }
  ) {
    // Solo published: evita churn de draft/publish (lifecycle "nuevo" + Algolia delete).
    return this.strapi.documents('api::negocio.negocio').update({
      documentId,
      data,
      status: 'published',
    });
  }

  /** @deprecated Prefer createNotificationService(strapi).sendEmail */
  async sendEmail(to: string, subject: string, html: string, text?: string) {
    const { createNotificationService } = await import('../../../services/notification-service');
    return createNotificationService(this.strapi).sendEmail({ to, subject, html, text });
  }

  /** @deprecated Prefer createNotificationService(strapi).sendAdminEmail */
  async sendAdminEmail(subject: string, html: string) {
    const { createNotificationService } = await import('../../../services/notification-service');
    return createNotificationService(this.strapi).sendAdminEmail(subject, html);
  }
}

export const createNegocioRepository = (strapi: any) => new NegocioRepository(strapi);
