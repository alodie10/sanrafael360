import type { Core } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';

/**
 * Custom controller for high-speed media registration.
 * Bypasses standard multipart upload to avoid 502 timeouts on weak servers.
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  registerCloudinary: asyncHandler(async (ctx: any) => {
    const { url, name, size, width, height, hash, ext, mime } = ctx.request.body;

    if (!url || !name) {
      throw new ValidationError('url y name son requeridos');
    }

    const fileData = {
      name,
      alternativeText: name,
      caption: name,
      width: width || 800,
      height: height || 600,
      formats: null,
      hash: hash || `file_${Date.now()}`,
      ext: ext || '.jpg',
      mime: mime || 'image/jpeg',
      size: size || 0,
      url,
      previewUrl: url,
      provider: 'local',
      provider_metadata: null,
      folderPath: '/',
    };

    const file = await strapi.query('plugin::upload.file').create({ data: fileData });
    return { id: file.id, url: file.url };
  }),
});
