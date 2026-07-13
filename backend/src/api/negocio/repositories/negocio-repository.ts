import { Core } from '@strapi/strapi';
import { ADMIN_EMAILS } from '../../../utils/constants';

export class NegocioRepository {
  private strapi: any;

  constructor(strapi: any) {
    this.strapi = strapi;
  }

  async findById(documentId: string, populate: string[] = []) {
    return await this.strapi.documents('api::negocio.negocio').findOne({
      documentId,
      populate,
    });
  }

  async findByOwner(userId: number, populate: string[] = []) {
    return await this.strapi.documents('api::negocio.negocio').findMany({
      filters: {
        owner: {
          id: { $eq: userId },
        },
      },
      populate,
      fields: ['nombre', 'slug', 'descripcion', 'is_premium', 'premium_valid_until', 'estado_reclamo', 'documentId'],
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

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      const emailService = this.strapi.plugin('email')?.service('email');
      if (emailService) {
        return await emailService.send({
          to,
          from: 'San Rafael 360 <no-reply@sanrafael360.com>',
          subject,
          html,
          text,
        });
      }
      this.strapi.log.warn('Servicio de email no disponible en el repositorio');
    } catch (err: any) {
      this.strapi.log.error(`[NegocioRepository] Error controlado en sendEmail: ${err.message}`);
      // No re-lanzamos el error para no colapsar la transacción de negocio
    }
  }

  async sendAdminEmail(subject: string, html: string) {
    // Enviar a todos los admins definidos
    return Promise.all(ADMIN_EMAILS.map(email => this.sendEmail(email, subject, html)));
  }
}

export const createNegocioRepository = (strapi: any) => new NegocioRepository(strapi);
