import { normalizeNombreKey } from '../crm-ingest';
import { createdAtRange } from '../crm-estado';

const COMERCIO = 'api::crm-comercio.crm-comercio';
const CONTACTO = 'api::crm-contacto.crm-contacto';
const PLANTILLA = 'api::crm-plantilla.crm-plantilla';
const ACTIVIDAD = 'api::crm-actividad.crm-actividad';

export type CrmContactoInput = {
  nombre: string;
  telefono?: string;
  telefono_normalizado?: string | null;
  instagram?: string;
  nota?: string;
  origen: 'manual' | 'lista_ia';
  comercioDocumentId: string;
};

export class CrmRepository {
  constructor(private readonly strapi: any) {}

  findComercioBySlug(slug: string) {
    return this.strapi.documents(COMERCIO).findFirst({
      filters: { slug: { $eq: slug } },
    });
  }

  findComercioByOwnerEmail(email: string) {
    return this.strapi.documents(COMERCIO).findFirst({
      filters: { owner_email: { $eq: email } },
    });
  }

  listComercios() {
    return this.strapi.documents(COMERCIO).findMany({
      sort: ['createdAt:asc'],
      limit: 100,
    });
  }

  createComercio(data: Record<string, unknown>) {
    return this.strapi.documents(COMERCIO).create({ data });
  }

  updateComercio(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents(COMERCIO).update({ documentId, data });
  }

  findPlantillaByComercio(comercioDocumentId: string) {
    return this.strapi.documents(PLANTILLA).findFirst({
      filters: { comercio: { documentId: { $eq: comercioDocumentId } } },
    });
  }

  createPlantilla(data: Record<string, unknown>) {
    return this.strapi.documents(PLANTILLA).create({ data });
  }

  updatePlantilla(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents(PLANTILLA).update({ documentId, data });
  }

  listContactos(
    comercioDocumentId: string,
    query?: { estado?: string; desde?: string; hasta?: string; soloCola?: boolean }
  ) {
    const filters: Record<string, unknown> = {
      comercio: { documentId: { $eq: comercioDocumentId } },
    };
    if (query?.soloCola !== false) {
      filters.$or = [{ en_cola: { $eq: true } }, { en_cola: { $null: true } }];
    }
    if (query?.estado) filters.estado = { $eq: query.estado };
    const createdAt = createdAtRange(query?.desde, query?.hasta);
    if (createdAt) filters.createdAt = createdAt;
    return this.strapi.documents(CONTACTO).findMany({
      filters,
      sort: ['createdAt:desc'],
      populate: ['categoria', 'negocio'],
      limit: 200,
    });
  }

  findContacto(documentId: string) {
    return this.strapi.documents(CONTACTO).findOne({
      documentId,
      populate: ['comercio', 'categoria', 'negocio'],
    });
  }

  async findDuplicate(input: {
    comercioDocumentId: string;
    telefonoNormalizado?: string | null;
    nombreKey: string;
  }) {
    const byPhone = await this.findDuplicateByPhone(input);
    if (byPhone) return byPhone;
    return this.findDuplicateByNombre(input);
  }

  private async findDuplicateByPhone(input: {
    comercioDocumentId: string;
    telefonoNormalizado?: string | null;
  }) {
    if (!input.telefonoNormalizado) return null;
    const rows = await this.strapi.documents(CONTACTO).findMany({
      filters: {
        comercio: { documentId: { $eq: input.comercioDocumentId } },
        telefono_normalizado: { $eq: input.telefonoNormalizado },
      },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  private async findDuplicateByNombre(input: {
    comercioDocumentId: string;
    telefonoNormalizado?: string | null;
    nombreKey: string;
  }) {
    if (input.telefonoNormalizado) return null;
    const rows = await this.strapi.documents(CONTACTO).findMany({
      filters: { comercio: { documentId: { $eq: input.comercioDocumentId } } },
      fields: ['nombre', 'telefono_normalizado', 'documentId'],
      limit: 200,
    });
    const hit = (rows || []).find((row: any) => {
      if (row.telefono_normalizado) return false;
      return normalizeNombreKey(row.nombre) === input.nombreKey;
    });
    return hit || null;
  }

  createContacto(data: Record<string, unknown>) {
    return this.strapi.documents(CONTACTO).create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono || '',
        telefono_normalizado: data.telefono_normalizado || null,
        instagram: data.instagram || '',
        nota: data.nota || '',
        origen: data.origen,
        estado: 'nuevo',
        no_contactar: false,
        en_cola: true,
        comercio: data.comercioDocumentId,
      },
    });
  }

  updateContacto(documentId: string, data: Record<string, unknown>) {
    return this.strapi.documents(CONTACTO).update({ documentId, data });
  }

  listEnviosWhatsapp(comercioDocumentId: string) {
    return this.strapi.documents(ACTIVIDAD).findMany({
      filters: {
        tipo: { $eq: 'envio_whatsapp' },
        contacto: { comercio: { documentId: { $eq: comercioDocumentId } } },
      },
      populate: { contacto: { populate: ['categoria', 'negocio'] } },
      sort: ['createdAt:desc'],
      limit: 100,
    });
  }

  async clearCola(comercioDocumentId: string) {
    const rows = await this.listContactos(comercioDocumentId);
    for (const row of rows || []) {
      await this.updateContacto(row.documentId, { en_cola: false });
    }
    return (rows || []).length;
  }

  createActividad(data: Record<string, unknown>) {
    return this.strapi.documents(ACTIVIDAD).create({ data });
  }

  listActividades(contactoDocumentId: string) {
    return this.strapi.documents(ACTIVIDAD).findMany({
      filters: { contacto: { documentId: { $eq: contactoDocumentId } } },
      sort: ['createdAt:desc'],
      limit: 50,
    });
  }
}

export const createCrmRepository = (strapi: any) => new CrmRepository(strapi);
