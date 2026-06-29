import type { Core } from '@strapi/strapi';

/**
 * Escapa un valor para CSV: envuelve en comillas dobles si contiene coma,
 * comilla doble o salto de línea. Escapa comillas dobles internas.
 */
function escapeCSV(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async metaCatalog(ctx: any) {
    // ── Seguridad: token por query param ──────────────────────────────
    const token = ctx.query?.token as string | undefined;
    const expectedToken = process.env.FEED_SECRET_TOKEN;

    if (expectedToken && token !== expectedToken) {
      ctx.status = 401;
      ctx.body = 'Token inválido';
      return;
    }

    // En producción sin token configurado, rechazamos siempre
    if (!expectedToken && process.env.NODE_ENV === 'production') {
      ctx.status = 401;
      ctx.body = 'Feed no configurado. Definí FEED_SECRET_TOKEN en las variables de entorno.';
      return;
    }

    try {
      // ── Fetch negocios premium publicados ─────────────────────────
      const negocios = await strapi.documents('api::negocio.negocio').findMany({
        filters: { is_premium: true },
        status: 'published',
        populate: ['logo', 'imagen_portada', 'categoria', 'ofertas'],
        limit: -1,
      });

      strapi.log.info(`[Feed] Total negocios premium encontrados: ${negocios.length}`);

      // ── Filtrar: solo fichas con imagen (Meta rechaza filas sin imagen) ──
      const conImagen = negocios.filter(
        (n: any) => n.imagen_portada?.url || n.logo?.url
      );

      strapi.log.info(`[Feed] Negocios con imagen: ${conImagen.length}`);

      // ── Construir CSV ─────────────────────────────────────────────
      const SITE_URL = 'https://sanrafael360.com';

      const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'custom_label_0',
        'custom_label_1',
        'custom_label_2',
      ];

      const rows = conImagen.map((n: any) => {
        const imageUrl = n.imagen_portada?.url || n.logo?.url || '';
        const categoriaNombre = n.categoria?.nombre || 'San Rafael 360';

        // Descripción: usa la real si existe, fallback a nombre — categoría
        const description =
          n.descripcion?.trim()
            ? n.descripcion.trim().substring(0, 5000)
            : `${n.nombre} — ${categoriaNombre}`;

        // Oferta activa (publicada y activa)
        const ofertaActiva = (n.ofertas || []).find(
          (o: any) => o.activa && o.publishedAt
        );

        return [
          n.documentId,                                      // id
          (n.nombre || '').substring(0, 150),                // title
          description,                                       // description
          'in stock',                                        // availability
          'new',                                             // condition
          '0 ARS',                                           // price
          `${SITE_URL}/negocios/${n.slug}`,                  // link
          imageUrl,                                          // image_link
          categoriaNombre,                                   // brand
          categoriaNombre,                                   // custom_label_0
          ofertaActiva?.titulo || '',                        // custom_label_1
          'premium',                                         // custom_label_2
        ];
      });

      const csvLines = [
        headers.join(','),
        ...rows.map((row: unknown[]) => row.map(escapeCSV).join(',')),
      ];

      const csvContent = csvLines.join('\n');

      ctx.set('Content-Type', 'text/csv; charset=utf-8');
      ctx.set('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
      ctx.body = csvContent;
    } catch (err: any) {
      strapi.log.error('[Feed] Error generando meta-catalog:', err);
      ctx.status = 500;
      ctx.body = 'Error interno generando el feed';
    }
  },
});
