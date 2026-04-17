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
      status: 'published',
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

  async uploadFile(documentId: string, field: string, files: any) {
    this.strapi.log.info(`[Repo] Uploading file for ${field} on documentId ${documentId}`);
    try {
      const uploadedFiles = await this.strapi.plugin('upload').service('upload').upload({
        data: {}, // Pure upload
        files,
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Upload returned no files');
      }

      const fileId = uploadedFiles[0].id;
      this.strapi.log.info(`[Repo] File uploaded (ID: ${fileId}). Linking to document...`);

      await this.strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          [field]: fileId,
        },
      });

      this.strapi.log.info(`[Repo] File link successful for field ${field}`);
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
}

export const createNegocioRepository = (strapi: any) => new NegocioRepository(strapi);
