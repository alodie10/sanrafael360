import { createFeedRepository } from '../repositories/feed-repository';
import { buildCsv } from '../utils/csv';

function getSiteUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.sanrafael360.com'
  ).replace(/\/$/, '');
}

function hasImage(entity: any): boolean {
  return Boolean(entity?.imagen_portada?.url || entity?.logo?.url);
}

export function assertFeedAccess(ctx: any): boolean {
  const token = ctx.query?.token as string | undefined;
  const expectedToken = process.env.FEED_SECRET_TOKEN;

  if (expectedToken && token !== expectedToken) {
    ctx.status = 401;
    ctx.body = 'Token inválido';
    return false;
  }

  if (!expectedToken && process.env.NODE_ENV === 'production') {
    ctx.status = 401;
    ctx.body = 'Feed no configurado. Definí FEED_SECRET_TOKEN en las variables de entorno.';
    return false;
  }

  return true;
}

export class FeedService {
  constructor(private readonly strapi: any) {}

  async buildMetaCatalogCsv(): Promise<string> {
    const repo = createFeedRepository(this.strapi);
    const negocios = await repo.findPremiumNegocios();

    this.strapi.log.info(`[Feed] Total negocios premium encontrados: ${negocios.length}`);

    const conImagen = negocios.filter(hasImage);
    this.strapi.log.info(`[Feed] Negocios con imagen: ${conImagen.length}`);

    const siteUrl = getSiteUrl();
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
      const description = n.descripcion?.trim()
        ? n.descripcion.trim().substring(0, 5000)
        : `${n.nombre} — ${categoriaNombre}`;
      const ofertaActiva = (n.ofertas || []).find((o: any) => o.activa && o.publishedAt);

      return [
        n.documentId,
        (n.nombre || '').substring(0, 150),
        description,
        'in stock',
        'new',
        '0 ARS',
        `${siteUrl}/negocios/${n.slug}`,
        imageUrl,
        categoriaNombre,
        categoriaNombre,
        ofertaActiva?.titulo || '',
        'premium',
      ];
    });

    return buildCsv(headers, rows);
  }

  async buildMetaOffersCsv(): Promise<string> {
    const repo = createFeedRepository(this.strapi);
    const now = new Date().toISOString();
    const ofertas = await repo.findActiveOfertas(now);

    this.strapi.log.info(`[Feed] Total ofertas activas y vigentes: ${ofertas.length}`);

    const validas = ofertas.filter((o: any) => hasImage(o.negocio));
    this.strapi.log.info(`[Feed] Ofertas con imagen de negocio: ${validas.length}`);

    const siteUrl = getSiteUrl();
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'sale_price',
      'link',
      'image_link',
      'brand',
      'custom_label_0',
      'custom_label_1',
      'custom_label_2',
    ];

    const rows = validas.map((o: any) => {
      const negocio = o.negocio;
      const imageUrl = negocio?.imagen_portada?.url || negocio?.logo?.url || '';
      const categoriaNombre = negocio?.categoria?.nombre || 'San Rafael 360';
      const negocioNombre = negocio?.nombre || 'San Rafael 360';
      const description = o.descripcion?.trim()
        ? o.descripcion.trim().substring(0, 5000)
        : `${o.tipo_oferta || 'Oferta'} en ${negocioNombre} — ${categoriaNombre}`;
      const price = o.precio_original ? `${o.precio_original} ARS` : '0 ARS';
      const salePrice = o.precio_descuento ? `${o.precio_descuento} ARS` : '';

      return [
        o.documentId,
        (o.titulo || '').substring(0, 150),
        description,
        'in stock',
        'new',
        price,
        salePrice,
        `${siteUrl}/negocios/${negocio?.slug}`,
        imageUrl,
        negocioNombre,
        o.tipo_oferta || 'Oferta',
        categoriaNombre,
        'oferta',
      ];
    });

    return buildCsv(headers, rows);
  }
}

export const createFeedService = (strapi: any) => new FeedService(strapi);
