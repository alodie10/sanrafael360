export const DEFAULT_PROSPECCION_PLANTILLA = {
  texto_ficha: '¡Mirá este comercio en San Rafael 360!',
  mensaje: [
    'Bienvenido a la guía local San Rafael 360. Por tener tu comercio en San Rafael ya pertenecés a nuestra guía. Si querés formar parte de nuestros clientes premium te cuento que por 40.000 $ el trimestre podemos darte:',
    '• Galería de fotos y videos',
    '• Mapas y GPS directos',
    '• Botones de contactos a todas tus redes',
    '• Publicidad en redes',
    '• Destaques y ofertas',
    'y un Reel promocional sin cargo',
  ].join('\n'),
  firma: 'Mi nombre es Diego Alonso, dueño de sanrafael360.com',
};

export type ProspeccionPlantillaFields = {
  texto_ficha: string;
  mensaje: string;
  firma: string;
};

export function composeFichaMensaje(input: {
  url: string;
  texto_ficha: string;
  mensaje: string;
  firma: string;
}): string {
  return [input.url, input.texto_ficha, input.mensaje, input.firma]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

export function resolveFirma(userFirma?: string | null, fallback?: string | null): string {
  const own = String(userFirma || '').trim();
  if (own) return own;
  return String(fallback || DEFAULT_PROSPECCION_PLANTILLA.firma).trim();
}

export function getPublicSiteUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.sanrafael360.com'
  ).replace(/\/$/, '');
}

export function fichaUrlForSlug(slug: string): string {
  return `${getPublicSiteUrl()}/negocios/${slug}`;
}
