
/**
 * Custom controller for high-speed media registration
 * This bypasses the standard multipart/form-data upload to avoid 502 timeouts on weak servers.
 */

export default {
  async registerCloudinary(ctx) {
    const { url, name, size, width, height, hash, ext, mime } = ctx.request.body;

    if (!url || !name) {
      return ctx.badRequest('Missing url or name');
    }

    try {
      // Create the file entry in Strapi's upload_file table
      const fileData = {
        name,
        alternativeText: name,
        caption: name,
        width: width || 800,
        height: height || 600,
        formats: null, // Bypassing formats to avoid extra Cloudinary overhead
        hash: hash || `file_${Date.now()}`,
        ext: ext || '.jpg',
        mime: mime || 'image/jpeg',
        size: size || 0,
        url: url, // External Cloudinary URL
        previewUrl: url,
        provider: 'cloudinary',
        provider_metadata: {
           public_id: hash || `file_${Date.now()}`,
           resource_type: 'image'
        },
        folderPath: '/',
      };

      const file = await strapi.query('plugin::upload.file').create({
        data: fileData,
      });

      return { id: file.id, url: file.url };
    } catch (err) {
      strapi.log.error('Error in registerCloudinary:', err);
      return ctx.internalServerError(err.message);
    }
  },
};
