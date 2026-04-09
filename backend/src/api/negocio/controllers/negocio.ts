import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async claim(ctx) {
    try {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado para reclamar un negocio');
      }

      // 0. Parsing de Payload (Soporte Multipart/Form-Data para Strapi 5)
      let bodyData = ctx.request.body;
      if (typeof bodyData.data === 'string') {
        try {
          bodyData = JSON.parse(bodyData.data);
        } catch (e) {
          console.error('❌ [CLAIM] Error parseando bodyData.data string:', e.message);
        }
      } else if (bodyData.data) {
        bodyData = bodyData.data;
      }
      
      const { message } = bodyData;
      console.log(`🚀 [CLAIM] Iniciando proceso para: ${id} | Usuario: ${user.email} | Msg: ${message || 'N/A'}`);

      // 1. Buscar el negocio (Document Service de Strapi 5)
      const negocio = await strapi.documents('api::negocio.negocio').findOne({
        documentId: id,
        populate: ['owner']
      });

      if (!negocio) {
        console.error(`❌ [CLAIM] Negocio no encontrado: ${id}`);
        return ctx.notFound('Negocio no encontrado');
      }

      if (negocio.owner && (negocio as any).estado_reclamo !== 'ninguno') {
        return ctx.badRequest('El negocio ya tiene un reclamo en proceso o asignado a un propietario');
      }

      // 2. Actualización de Base de Datos (Document Service - MÁS ROBUSTO)
      console.log(`📝 [CLAIM] Actualizando estado de reclamo...`);
      
      const updatedNegocio = await strapi.documents('api::negocio.negocio').update({
        documentId: id,
        data: {
          estado_reclamo: 'pendiente',
          owner: user.id
        }
      });
      
      // 2b. Manejo de Documentación (Files)
      const { files } = ctx.request as any;
      if (files && (files.files || files.file)) {
        console.log(`📎 [CLAIM] Procesando archivo de documentación adjunto...`);
        const fileToUpload = files.files || files.file;
        
        try {
          await strapi.plugin('upload').service('upload').upload({
            data: {
              refId: updatedNegocio.id,
              ref: 'api::negocio.negocio',
              field: 'documentacion_reclamo',
            },
            files: fileToUpload,
          });
          console.log(`✅ [CLAIM] Documentación vinculada.`);
        } catch (uploadErr: any) {
          console.error(`❌ [CLAIM] Error subiendo archivo:`, uploadErr.message);
        }
      }

      console.log(`✅ [CLAIM] Proceso finalizado exitosamente.`);

      // 3. Notificación por Email (Fire & Forget)
      try {
        const emailService = strapi.plugin('email')?.service('email');
        if (emailService) {
          emailService.send({
            to: 'diegocristianalonso@gmail.com',
            from: 'no-reply@sanrafael360.com.ar',
            subject: `Nuevo reclamo de negocio: ${negocio.nombre}`,
            text: `El usuario ${user.email} ha reclamado "${negocio.nombre}".\n\nMensaje: ${message || 'Sin mensaje'}\n\nRevisa la documentación en el panel de Strapi.`,
          }).catch((err: any) => console.error('✉️ [CLAIM] Error email asíncrono:', err.message));
        }
      } catch (e: any) {
        console.warn('⚠️ [CLAIM] Fallo inicialización email:', e.message);
      }

      return ctx.send({ 
        message: 'Reclamo enviado correctamente', 
        data: { documentId: id, estado_reclamo: 'pendiente' } 
      });

    } catch (err: any) {
      console.error('💥 [CLAIM] ERROR CRÍTICO:', err.message);
      return ctx.internalServerError(`Error interno: ${err.message}`);
    }
  },

  async me(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Debes estar autenticado para ver tus negocios');
    }

    try {
      console.log(`🔍 [PORTAL] Buscando negocios propios para: ${user.email} (ID: ${user.id})`);
      
      const { data: negocios } = await strapi.documents('api::negocio.negocio').findMany({
        filters: {
          owner: user.id
        },
        populate: ['logo', 'categoria', 'imagen_portada', 'galeria'],
        status: 'published'
      }) as any;

      // Deduplicación explícita por ID para evitar duplicados por joins de relaciones
      const uniqueNegocios = Array.from(new Map(negocios.map((item: any) => [item.id, item])).values());

      console.log(`📦 [PORTAL] Encontrados ${uniqueNegocios.length} negocios únicos (de ${negocios.length} registros).`);
      return ctx.send({ data: uniqueNegocios });

    } catch (err: any) {
      console.error('💥 [PORTAL] Error en endpoint /me:', err.message);
      return ctx.internalServerError('Error al recuperar tus negocios.');
    }
  },

  async portalUpdate(ctx) {
    try {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado');
      }

      // 1. Verificar propiedad y campos permitidos
      const negocio = await strapi.documents('api::negocio.negocio').findOne({
        documentId: id,
        populate: ['owner']
      });

      if (!negocio) return ctx.notFound('Negocio no encontrado');
      
      // Comprobación de seguridad robusta de dueño
      const ownerId = negocio.owner?.id;
      if (Number(ownerId) !== Number(user.id)) {
        console.error(`🚫 [PORTAL-UPDATE] Intento de acceso no autorizado. User ${user.id} != Owner ${ownerId}`);
        return ctx.forbidden('No eres el dueño de este negocio');
      }

      // 2. Extraer y filtrar data
      let bodyData = ctx.request.body;
      if (typeof bodyData.data === 'string') {
        bodyData = JSON.parse(bodyData.data);
      } else if (bodyData.data) {
        bodyData = bodyData.data;
      }

      // Whitelist de campos permitidos para el dueño
      const allowedFields = [
        'descripcion', 
        'facebook', 
        'website', 
        'reserva_habilitada'
      ];
      
      const updateData: any = {};
      allowedFields.forEach(field => {
        if (bodyData[field] !== undefined) {
          updateData[field] = bodyData[field];
        }
      });

      console.log(`📝 [PORTAL-UPDATE] Actualizando negocio ${id}:`, Object.keys(updateData));

      // 3. Ejecutar actualización de campos de texto
      const updatedDocument = await strapi.documents('api::negocio.negocio').update({
        documentId: id,
        data: updateData
      });

      // 4. Procesar archivos (Logo, Portada, Galería)
      const { files } = ctx.request as any;
      if (files) {
        const uploadService = strapi.plugin('upload').service('upload');
        
        // Función auxiliar para subir y vincular
        const uploadToField = async (file: any, fieldName: string) => {
          if (!file) return;
          console.log(`📎 [PORTAL-UPDATE] Subiendo archivo para campo: ${fieldName}`);
          await uploadService.upload({
            data: {
              refId: updatedDocument.id,
              ref: 'api::negocio.negocio',
              field: fieldName,
            },
            files: file,
          });
        };

        if (files.logo) await uploadToField(files.logo, 'logo');
        if (files.imagen_portada) await uploadToField(files.imagen_portada, 'imagen_portada');
        if (files.galeria) await uploadToField(files.galeria, 'galeria');
      }

      return ctx.send({ 
        message: 'Negocio actualizado correctamente',
        data: updatedDocument 
      });

    } catch (err: any) {
      console.error('💥 [PORTAL-UPDATE] ERROR:', err.message);
      return ctx.internalServerError(`Error al actualizar: ${err.message}`);
    }
  }
}));
