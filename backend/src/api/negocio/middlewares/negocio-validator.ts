import { ValidationError } from '../../../utils/errors';

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Extracción de datos (Manejo Multipart y JSON)
    let bodyData = ctx.request.body;
    if (typeof bodyData.data === 'string') {
      try {
        bodyData = JSON.parse(bodyData.data);
      } catch (e) {
        throw new ValidationError('Invalid JSON in data field');
      }
    } else if (bodyData.data) {
      bodyData = bodyData.data;
    }

    // Lógica de validación según el endpoint
    const path = ctx.path;

    if (path.includes('/claim')) {
      if (!bodyData.message || bodyData.message.length < 10) {
        throw new ValidationError('El mensaje de reclamo debe tener al menos 10 caracteres.');
      }
    }

    if (path.includes('/portal-update')) {
      // Si la petición es solo para disparar el discovery (como en AdminDiscoveryTool), no exigimos descripción
      const isOnlyTriggerDiscovery = bodyData && bodyData.trigger_discovery === true && Object.keys(bodyData).length === 1;
      
      if (!isOnlyTriggerDiscovery) {
        const requiredFields = ['descripcion'];
        for (const field of requiredFields) {
          if (!bodyData[field]) {
            throw new ValidationError(`El campo ${field} es obligatorio.`);
          }
        }
      }
    }

    await next();
  };
};
