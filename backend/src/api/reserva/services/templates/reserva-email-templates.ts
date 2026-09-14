import { escapeHtml } from '../../../../utils/html-escape';

/** Templates HTML mínimos para mails de reserva. */

export function reservaConfirmacionEmail(params: {
  clienteNombre: string;
  comercioNombre: string;
  recursoNombre: string;
  cuando: string;
  codigo: string;
  textoLlegada?: string | null;
  cancelUrl?: string | null;
}) {
  const safeCancel = params.cancelUrl ? escapeHtml(params.cancelUrl) : '';
  const cancelBlock = safeCancel
    ? `<p style="margin-top:24px;"><a href="${safeCancel}" style="color:#b45309;">Solicitar cancelación</a> — te vamos a pedir que escribas al local por WhatsApp; ellos confirman y gestionan el reembolso si corresponde.</p>`
    : '';
  const llegada = params.textoLlegada
    ? `<p style="color:#555;">${escapeHtml(params.textoLlegada)}</p>`
    : '';

  return {
    subject: `Reserva confirmada · ${params.comercioNombre} · ${params.codigo}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#111;">
        <h1 style="font-size:22px;">¡Listo, ${escapeHtml(params.clienteNombre)}!</h1>
        <p>Tu turno en <strong>${escapeHtml(params.comercioNombre)}</strong> quedó confirmado.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#888;">Código</td><td style="padding:8px;">${escapeHtml(params.codigo)}</td></tr>
          <tr><td style="padding:8px;color:#888;">Cuándo</td><td style="padding:8px;">${escapeHtml(params.cuando)}</td></tr>
          <tr><td style="padding:8px;color:#888;">Recurso</td><td style="padding:8px;">${escapeHtml(params.recursoNombre)}</td></tr>
        </table>
        ${llegada}
        ${cancelBlock}
      </div>
    `,
  };
}

export function reservaCancelacionEmail(params: {
  clienteNombre: string;
  comercioNombre: string;
  codigo: string;
  reembolsoNota?: string | null;
}) {
  return {
    subject: `Reserva cancelada · ${params.comercioNombre} · ${params.codigo}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#111;">
        <h1 style="font-size:22px;">Reserva cancelada</h1>
        <p>Hola ${escapeHtml(params.clienteNombre)}, cancelamos tu turno <strong>${escapeHtml(params.codigo)}</strong> en ${escapeHtml(params.comercioNombre)}.</p>
        ${params.reembolsoNota ? `<p>${escapeHtml(params.reembolsoNota)}</p>` : ''}
      </div>
    `,
  };
}
