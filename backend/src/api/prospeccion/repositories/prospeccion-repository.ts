import {
  DEFAULT_PROSPECCION_PLANTILLA,
  type ProspeccionPlantillaFields,
} from '../plantilla-defaults';

const CONTACTO_UID = 'api::prospeccion-contacto.prospeccion-contacto';
const PLANTILLA_UID = 'api::prospeccion-plantilla.prospeccion-plantilla';
const NEGOCIO_UID = 'api::negocio.negocio';

const NEGOCIO_POPULATE = {
  categoria: { fields: ['nombre'] },
};

export type AlcanzadosQuery = {
  q?: string;
  startDate?: string;
  endDate?: string;
};

export class ProspeccionRepository {
  constructor(private readonly strapi: any) {}

  async findPlantilla() {
    return this.strapi.documents(PLANTILLA_UID).findFirst();
  }

  async createPlantilla(data: ProspeccionPlantillaFields) {
    return this.strapi.documents(PLANTILLA_UID).create({ data });
  }

  async updatePlantilla(documentId: string, data: ProspeccionPlantillaFields) {
    return this.strapi.documents(PLANTILLA_UID).update({ documentId, data });
  }

  async findNegocioByDocumentId(documentId: string) {
    return this.strapi.documents(NEGOCIO_UID).findOne({
      documentId,
      fields: ['nombre', 'slug', 'whatsapp', 'telefono', 'documentId'],
      populate: NEGOCIO_POPULATE,
    });
  }

  async searchNegocios(search: string) {
    return this.strapi.documents(NEGOCIO_UID).findMany({
      filters: { nombre: { $containsi: search.trim() } },
      fields: ['nombre', 'slug', 'whatsapp', 'telefono', 'documentId'],
      populate: NEGOCIO_POPULATE,
      sort: ['nombre:asc'],
      limit: 20,
      status: 'published',
    });
  }

  async findContactoByNegocio(negocioDocumentId: string) {
    const rows = await this.strapi.documents(CONTACTO_UID).findMany({
      filters: { negocio: { documentId: { $eq: negocioDocumentId } } },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  async createContacto(data: Record<string, unknown>) {
    return this.strapi.documents(CONTACTO_UID).create({ data });
  }

  async updateContacto(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents(CONTACTO_UID).update({ documentId, data });
  }

  async findAlcanzados(query: AlcanzadosQuery) {
    const filters: Record<string, unknown> = {};
    if (query.startDate && query.endDate) {
      filters.ultimo_envio_at = {
        $gte: `${query.startDate}T00:00:00.000-03:00`,
        $lte: `${query.endDate}T23:59:59.999-03:00`,
      };
    }
    if (query.q?.trim()) {
      filters.negocio = { nombre: { $containsi: query.q.trim() } };
    }

    return this.strapi.documents(CONTACTO_UID).findMany({
      filters,
      populate: {
        negocio: {
          fields: ['nombre', 'slug', 'whatsapp', 'telefono', 'documentId'],
          populate: NEGOCIO_POPULATE,
        },
      },
      sort: ['ultimo_envio_at:desc'],
      limit: 100,
    });
  }
}

export const createProspeccionRepository = (strapi: any) =>
  new ProspeccionRepository(strapi);

export function plantillaFromDoc(doc: any): ProspeccionPlantillaFields {
  if (!doc) return { ...DEFAULT_PROSPECCION_PLANTILLA };
  return {
    texto_ficha: doc.texto_ficha || DEFAULT_PROSPECCION_PLANTILLA.texto_ficha,
    mensaje: doc.mensaje || DEFAULT_PROSPECCION_PLANTILLA.mensaje,
    firma: doc.firma || DEFAULT_PROSPECCION_PLANTILLA.firma,
  };
}
