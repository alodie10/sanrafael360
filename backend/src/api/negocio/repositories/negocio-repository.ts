import { Core } from '@strapi/strapi';

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
      status: 'draft',
    });
  }

  async update(documentId: string, data: any) {
    return await this.strapi.documents('api::negocio.negocio').update({
      documentId,
      data,
    });
  }

  async publish(documentId: string) {
    return await this.strapi.documents('api::negocio.negocio').publish({
      documentId,
    });
  }

  async findPendingClaims(populate: string[] = []) {
    return await this.strapi.documents('api::negocio.negocio').findMany({
      filters: {
        estado_reclamo: 'pendiente',
      },
      populate,
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
    throw new Error('Servicio de email no disponible');
  }

  async sendAdminEmail(subject: string, html: string) {
    return await this.sendEmail('diegocristianalonso@gmail.com', subject, html);
  }
}

export const createNegocioRepository = (strapi: any) => new NegocioRepository(strapi);
