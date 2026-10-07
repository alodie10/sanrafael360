import { escapeHtml } from '../../utils/html-escape';

const GOLD = '#E6B325';
const INK = '#FAFAFA';
const MUTED = '#A1A1AA';
const CARD = '#111113';

export type CrmMailPieza = {
  titulo?: string;
  previewUrl?: string;
  imageUrl?: string;
  pageUrl?: string;
};

export type CrmMailHtmlInput = {
  saludo: string;
  nombre: string;
  mensaje: string;
  firma: string;
  pieza?: CrmMailPieza | null;
};

export function httpsUrl(raw?: string | null): string {
  const value = String(raw || '').trim();
  return /^https:\/\//i.test(value) ? value : '';
}

export function renderCrmMailHtml(input: CrmMailHtmlInput): string {
  const saludo = escapeHtml(input.saludo);
  const nombre = String(input.nombre || '').trim();
  const hola = escapeHtml(nombre ? `Hola ${nombre},` : 'Hola,');
  const cuerpo = parrafosHtml(input.mensaje);
  const firma = escapeHtml(input.firma);
  const imagen = bloqueImagen(input.pieza);
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000000;">
  <div style="display:none;max-height:0;overflow:hidden;">${saludo} ${hola}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:${CARD};border:1px solid #27272a;border-radius:28px;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.18em;text-transform:uppercase;color:${INK};">
            San Rafael <span style="color:${GOLD};font-weight:700;letter-spacing:0;">360</span>
          </p>
          <p style="margin:10px 0 0;font-family:Georgia,serif;font-style:italic;font-size:28px;line-height:1.2;color:${GOLD};">${saludo}</p>
        </td></tr>
        <tr><td style="padding:8px 28px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:20px;line-height:1.4;color:${INK};">${hola}</p>
        </td></tr>
        <tr><td style="padding:16px 28px 0;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:${INK};">${cuerpo}</td></tr>
        ${imagen}
        <tr><td style="padding:8px 28px 28px;">
          <p style="margin:0 0 16px;width:48px;border-top:2px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.5;color:${MUTED};">${firma}</p>
          <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#71717a;">
            <a href="https://www.sanrafael360.com" style="color:${GOLD};text-decoration:none;">sanrafael360.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function parrafosHtml(mensaje: string): string {
  const bloques = String(mensaje || '')
    .split(/\n{2,}/)
    .map((parte) => parte.trim())
    .filter(Boolean);
  const partes = bloques.length ? bloques : [''];
  return partes
    .map(
      (parte) =>
        `<p style="margin:0 0 14px;">${escapeHtml(parte).replace(/\n/g, '<br>')}</p>`
    )
    .join('');
}

function bloqueImagen(pieza?: CrmMailPieza | null): string {
  const src = httpsUrl(pieza?.previewUrl) || httpsUrl(pieza?.imageUrl);
  if (!src) return '';
  const alt = escapeHtml(pieza?.titulo || 'San Rafael 360');
  const href = httpsUrl(pieza?.pageUrl);
  const img = `<img src="${escapeHtml(src)}" alt="${alt}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;border-radius:18px;">`;
  const figura = href
    ? `<a href="${escapeHtml(href)}" style="text-decoration:none;">${img}</a>`
    : img;
  const boton = href
    ? `<p style="margin:16px 0 0;">
        <a href="${escapeHtml(href)}" style="display:inline-block;background:${GOLD};color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:14px 22px;border-radius:14px;">Ver la pieza</a>
      </p>`
    : '';
  return `<tr><td style="padding:8px 28px 8px;">${figura}${boton}</td></tr>`;
}
