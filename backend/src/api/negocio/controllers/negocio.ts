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
      
      // 2b. Manejo de Documentación (Files) - MANDATORIO
      const { files } = ctx.request as any;
      const fileToUpload = files?.files || files?.file;

      if (!fileToUpload) {
        return ctx.badRequest('La documentación probatoria (DNI o Habilitación) es obligatoria para reclamar un negocio.');
      }

      console.log(`📎 [CLAIM] Procesando archivo de documentación adjunto...`);
      
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

      console.log(`✅ [CLAIM] Proceso finalizado exitosamente.`);

      // 4. Notificación por WhatsApp (vía Webhook)
      try {
        const whatsappUrl = process.env.WHATSAPP_WEBHOOK_URL;
        if (whatsappUrl && whatsappUrl !== 'https://api.ultramsg.com/instanceXXXX/messages/chat') {
          console.log('📱 [CLAIM] Enviando notificación WhatsApp...');
          await fetch(whatsappUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: process.env.WHATSAPP_TOKEN,
              to: process.env.WHATSAPP_ADMIN_NUMBER || '5492604000000',
              body: `🔔 *San Rafael 360*\n\nNuevo reclamo de negocio:\n*${negocio.nombre}*\n\nUsuario: ${user.email}\n\nRevisa el panel para aprobar.`
            })
          });
        }
      } catch (waErr: any) {
        console.error('❌ [CLAIM] Error notificación WhatsApp:', waErr.message);
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
      if (!user.id) return ctx.unauthorized('Usuario sin ID válido');

      console.log(`🔍 [PORTAL] Buscando negocios propios para: ${user.email} (ID: ${user.id})`);
      
      // Sintaxis robusta para Strapi 5 Document Service
      const result = await strapi.documents('api::negocio.negocio').findMany({
        filters: {
          owner: {
            id: {
              $eq: user.id
            }
          }
        },
        populate: ['logo', 'categoria', 'imagen_portada', 'galeria'],
        status: 'published'
      });

      // En Strapi 5, 'findMany' del Document Service devuelve directamente el array de documentos
      const negocios = (result as any[]) || [];

      // Deduplicación explícita por ID para evitar duplicados por joins de relaciones
      const uniqueNegocios = Array.from(new Map(negocios.map((item: any) => [item.id, item])).values());

      console.log(`📦 [PORTAL] Encontrados ${uniqueNegocios.length} negocios únicos.`);
      return ctx.send({ data: uniqueNegocios });

    } catch (err: any) {
      console.error('💥 [PORTAL] Error crítico en endpoint /me:', err.message);
      // Cumplimos el estándar: Devolver 200 con array vacío en caso de error de consulta para no romper la UI
      return ctx.send({ data: [], error: 'Error interno recuperando negocios' });
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
        'instagram',
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

      // 5. PUBLICACIÓN INSTANTÁNEA (Crucial para Strapi 5)
      // Esto asegura que los cambios sean visibles en el sitio público y en el perfil (/me)
      console.log(`🚀 [PORTAL-UPDATE] Publicando cambios para el negocio: ${id}`);
      await strapi.documents('api::negocio.negocio').publish({
        documentId: id
      });

      return ctx.send({ 
        message: 'Negocio actualizado y publicado correctamente',
        data: updatedDocument 
      });

    } catch (err: any) {
      console.error('💥 [PORTAL-UPDATE] ERROR:', err.message);
      return ctx.send({ error: `Error al actualizar: ${err.message}` });
    }
  },

  // --- MÉTODOS ADMINISTRATIVOS ---

  async adminPendingClaims(ctx) {
    const user = ctx.state.user;
    const adminRole = process.env.ADMIN_ROLE_NAME || 'Admin';

    if (!user || user.role?.name !== adminRole) {
      return ctx.forbidden(`No tienes permisos de administrador (Rol requerido: ${adminRole}).`);
    }

    try {
      const claims = await strapi.documents('api::negocio.negocio').findMany({
        filters: {
          estado_reclamo: 'pendiente'
        },
        populate: ['owner', 'logo']
      });

      return ctx.send({ data: claims });
    } catch (err: any) {
      console.error('💥 [ADMIN-CLAIMS] Error:', err.message);
      return ctx.internalServerError('Error al recuperar reclamos.');
    }
  },

  async adminResolveClaim(ctx) {
    const user = ctx.state.user;
    const adminRole = process.env.ADMIN_ROLE_NAME || 'Admin';

    if (!user || user.role?.name !== adminRole) {
      return ctx.forbidden(`No tienes permisos de administrador (Rol requerido: ${adminRole}).`);
    }

    try {
      const { id } = ctx.params;
      const { decision, motivo } = ctx.request.body; // 'approved' o 'rejected'

      const negocio = await strapi.documents('api::negocio.negocio').findOne({
        documentId: id,
        populate: ['owner']
      });

      if (!negocio) return ctx.notFound('Negocio no encontrado');

      const ownerEmail = negocio.owner?.email;
      const ownerName = negocio.owner?.username || 'Emprendedor';

      if (decision === 'approved') {
        // 1. Aprobar
        await strapi.documents('api::negocio.negocio').update({
          documentId: id,
          data: {
            estado_reclamo: 'aprobado'
          }
        });
        await strapi.documents('api::negocio.negocio').publish({ documentId: id });

        // 2. Notificar por Email (Aprobado)
        try {
          await strapi.plugin('email').service('email').send({
            to: ownerEmail,
            from: 'San Rafael 360 <no-reply@sanrafael360.com>',
            subject: `🚀 ¡Bienvenido a San Rafael 360! Perfil de ${negocio.nombre} Aprobado`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #2563eb;">¡Felicidades, ${ownerName}!</h2>
                <p>Tu solicitud de propiedad para <strong>${negocio.nombre}</strong> ha sido aprobada con éxito.</p>
                <p>Ya puedes acceder a tu portal para gestionar las fotos, redes sociales y el sitio web de tu negocio.</p>
                <div style="margin: 30px 0;">
                  <a href="https://sanrafael360.vercel.app/portal" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Entrar a mi Portal</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">Si tienes dudas, puedes responder a este email o contactarnos por WhatsApp.</p>
              </div>
            `
          });
          console.log(`📧 Email de aprobación enviado a: ${ownerEmail}`);
        } catch (e: any) {
          console.error('❌ Error enviando email de aprobación:', e.message);
        }

      } else {
        // 1. Rechazar Cordialmente
        // Ponemos el estado en 'ninguno' para que el usuario pueda re-postular con info corregida
        await strapi.documents('api::negocio.negocio').update({
          documentId: id,
          data: {
            estado_reclamo: 'ninguno',
            owner: null // Desvinculamos para permitir re-reclamo si fuera necesario
          }
        });
        await strapi.documents('api::negocio.negocio').publish({ documentId: id });

        // 2. Notificar por Email (Rechazo Cordial)
        try {
          await strapi.plugin('email').service('email').send({
            to: ownerEmail,
            from: 'San Rafael 360 <no-reply@sanrafael360.com>',
            subject: `Información sobre tu solicitud en San Rafael 360`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #4b5563;">Hola ${ownerName},</h2>
                <p>Lamentablemente no hemos podido aprobarte como dueño de <strong>${negocio.nombre}</strong> porque:</p>
                <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; font-style: italic;">
                  ${motivo || 'Necesitamos documentación más clara de la propiedad.'}
                </blockquote>
                <p>No te preocupes, puedes volver a enviar el formulario con la información corregida para terminar el trámite cuando gustes.</p>
                <div style="margin: 30px 0;">
                   <a href="https://wa.me/5492604000000" style="background: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Consultar por WhatsApp</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">Atentamente, el equipo de San Rafael 360.</p>
              </div>
            `
          });
          console.log(`📧 Email de rechazo enviado a: ${ownerEmail}`);
        } catch (e: any) {
          console.error('❌ Error enviando email de rechazo:', e.message);
        }
      }

      return ctx.send({ message: 'Resolución procesada y notificada.' });

    } catch (err: any) {
      console.error('💥 [ADMIN-RESOLVE] Error:', err.message);
      return ctx.internalServerError(`Error al procesar: ${err.message}`);
    }
  }
}));
