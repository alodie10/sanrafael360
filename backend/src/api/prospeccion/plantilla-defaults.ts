export const DEFAULT_PROSPECCION_PLANTILLA = {
  texto_ficha: 'Si querés publicar con nosotros, esta es nuestra guía.',
  mensaje: [
    'Por $40.000 el trimestre podemos darte:',
    '• Galería de fotos y videos',
    '• Mapas y GPS directos',
    '• Botones de contactos a todas tus redes',
    '• Publicidad en redes',
    '• Destaques y ofertas',
    'y un Reel promocional sin cargo',
  ].join('\n'),
  firma: 'Mi nombre es Diego Alonso, dueño de sanrafael360.com',
};

const LEGACY_TEXTO_FICHA = [
  '¡Mirá este comercio en San Rafael 360!',
  'Tenés tu ficha en San Rafael 360',
];

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

/** Home pública de la guía. Ya no se manda el link de un negocio puntual. */
export function guideHomeUrl(): string {
  return getPublicSiteUrl();
}

export function migratePlantillaCopy(current: ProspeccionPlantillaFields): ProspeccionPlantillaFields {
  const texto = String(current.texto_ficha || '').trim();
  const mensaje = String(current.mensaje || '').trim();
  const next = { ...current, texto_ficha: texto, mensaje };
  if (LEGACY_TEXTO_FICHA.includes(texto) || /tu ficha en san rafael/i.test(texto)) {
    next.texto_ficha = DEFAULT_PROSPECCION_PLANTILLA.texto_ficha;
  }
  if (/ya pertenec[eé]s a nuestra gu[ií]a/i.test(mensaje) || /bienvenido a la gu[ií]a local/i.test(mensaje)) {
    next.mensaje = DEFAULT_PROSPECCION_PLANTILLA.mensaje;
  }
  return next;
}
