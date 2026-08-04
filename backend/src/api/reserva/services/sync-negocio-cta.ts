import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';

/**
 * Sincroniza el CTA del negocio del directorio con el slug del módulo de reservas.
 * RES-DEC-010 / punto 3: con módulo activo el botón de la ficha apunta a /reservas/{slug}.
 */

export function buildNegocioCtaFromReservaSlug(slug: string) {
  const clean = String(slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  const publicPath = `/reservas/${clean}`;
  const frontendUrl = (process.env.FRONTEND_URL || 'https://sanrafael360.com').replace(
    /\/$/,
    ''
  );
  return {
    reserva_url: publicPath,
    reserva_habilitada: true,
    cta_habilitado: true,
    cta_link: `${frontendUrl}${publicPath}`,
    cta_boton_texto: 'Reservar turno',
    cta_titulo: 'Reserve su turno',
    cta_tag_confirmacion: true,
  };
}

export async function syncNegocioCtaFromReservaSlug(
  strapi: any,
  negocioDocumentId: string,
  reservaSlug: string
) {
  if (!negocioDocumentId || !reservaSlug) return;
  const repo = createNegocioRepository(strapi);
  await repo.updateDraftAndPublished(
    negocioDocumentId,
    buildNegocioCtaFromReservaSlug(reservaSlug)
  );
}

/** Si el comercio está linkeado a un negocio, re-aplica CTA del módulo. */
export async function syncLinkedNegocioCtaFromComercio(strapi: any, comercio: any) {
  const negocioId =
    comercio?.negocio?.documentId ||
    (typeof comercio?.negocio === 'string' ? comercio.negocio : null);
  const slug = comercio?.slug;
  if (!negocioId || !slug) return;
  await syncNegocioCtaFromReservaSlug(strapi, negocioId, slug);
}
