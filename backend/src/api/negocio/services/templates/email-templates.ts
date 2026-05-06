export const getAdminClaimEmail = (negocioName: string, userEmail: string, message: string) => `
<div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <h2 style="color: #2563eb; margin-top: 0;">Nueva Solicitud de Verificación</h2>
  <p style="font-size: 16px; line-height: 1.6;">Se ha recibido una nueva solicitud para reclamar la propiedad de un negocio en <strong>San Rafael 360</strong>.</p>
  
  <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Negocio:</strong> ${negocioName}</p>
    <p style="margin: 5px 0;"><strong>Solicitante:</strong> ${userEmail}</p>
    <p style="margin: 5px 0;"><strong>Mensaje:</strong> ${message || '<em>Sin mensaje adjunto</em>'}</p>
  </div>

  <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">Por favor, revise la documentación adjunta y apruebe o rechace el reclamo desde el portal de administración.</p>
  
  <div style="text-align: center;">
    <a href="https://www.sanrafael360.com/portal/admin" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">Ir al Portal de Administración</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático de San Rafael 360.</p>
</div>`;

export const getOwnerResolutionEmail = (negocioName: string, isApproved: boolean, motivo?: string) => `
<div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
  <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">${isApproved ? 'Felicidades, tu negocio es tuyo' : 'Tu reclamo ha sido revisado'}</h2>
  <p>Hola, el equipo de <b>San Rafael 360</b> ha procesado tu solicitud para <b>${negocioName}</b>.</p>
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
    <p><strong>Estado:</strong> ${isApproved ? 'Aprobado ✅' : 'Rechazado ❌'}</p>
    ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
  </div>
  ${isApproved ? '<p>Ya puedes acceder al portal para editar tu información premium.</p>' : '<p>Si crees que esto es un error, por favor contáctanos via Soporte.</p>'}
  <div style="margin-top: 30px; text-align: center;">
    <a href="https://www.sanrafael360.com/portal" style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ir al Portal</a>
  </div>
</div>`;
