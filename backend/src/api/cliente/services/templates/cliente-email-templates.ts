/**
 * Plantilla de avisos a clientes (broadcast / prueba).
 * El cuerpo HTML lo compone el admin; se envuelve con marca y pie de baja.
 */
export function wrapClienteAvisosEmail(bodyHtml: string, options: { isTest?: boolean } = {}): string {
  const testBanner = options.isTest
    ? `<div style="background:#fef3c7;color:#92400e;padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:13px;font-weight:600;">MAIL DE PRUEBA — no es un envío a clientes</div>`
    : '';

  return `
<div style="font-family:Georgia,serif;padding:28px;border:1px solid #e7e5e4;border-radius:16px;max-width:640px;margin:0 auto;color:#1c1917;background:#fffaf5;">
  ${testBanner}
  <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a8a29e;margin:0 0 8px;">San Rafael 360</p>
  <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;">
    ${bodyHtml}
  </div>
  <hr style="border:0;border-top:1px solid #e7e5e4;margin:28px 0 16px;" />
  <p style="font-family:system-ui,sans-serif;font-size:12px;color:#78716c;line-height:1.5;margin:0;">
    Guía comercial de San Rafael. Enviamos avisos puntuales sobre novedades que podés aprovechar en tu ficha.
    Si preferís no recibir estos mensajes, respondé este correo o escribinos a
    <a href="mailto:hola@sanrafael360.com" style="color:#0f172a;">hola@sanrafael360.com</a>.
  </p>
</div>`.trim();
}
