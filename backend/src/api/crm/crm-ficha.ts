import { ForbiddenError, ValidationError } from '../../utils/errors';
import { normalizeWhatsappDigits } from '../../utils/whatsapp';
import { modoOf, type CrmActor } from './crm-tenant';

export function categoriaIdOf(row: any): string {
  const rel = row?.categoria;
  if (!rel) return '';
  if (typeof rel === 'string' || typeof rel === 'number') return String(rel);
  return String(rel.documentId || rel.id || '');
}

export function negocioResumen(row: any): { documentId: string; slug: string; nombre: string } | null {
  const rel = row?.negocio;
  if (!rel) return null;
  if (typeof rel === 'string') return { documentId: rel, slug: '', nombre: '' };
  const documentId = rel.documentId || rel.id;
  if (!documentId) return null;
  return {
    documentId: String(documentId),
    slug: rel.slug || '',
    nombre: rel.nombre || '',
  };
}

export function assertGuiaPuedePublicar(actor: CrmActor, comercio: any) {
  if (!actor.isAdmin || modoOf(comercio) !== 'guia') {
    throw new ForbiddenError('Solo San Rafael 360 puede publicar fichas desde el CRM');
  }
}

export function patchContactoTrasFicha(categoria: string, negocioDocumentId: string) {
  return { categoria, negocio: negocioDocumentId };
}

export type FichaTelefonoCandidata = {
  documentId: string;
  slug?: string;
  nombre?: string;
  telefono?: string | null;
  whatsapp?: string | null;
  categoriaId?: string;
  published?: boolean;
};

export type FichaPorTelefono = {
  documentId: string;
  slug: string;
  nombre: string;
  categoriaId: string;
};

/** Ficha del directorio cuyo teléfono o WhatsApp coincide con el del contacto. */
export function fichaPorTelefono(
  candidatos: FichaTelefonoCandidata[],
  telefono?: string | null
): FichaPorTelefono | null {
  const digits = normalizeWhatsappDigits(telefono);
  if (!digits) return null;
  const hits = candidatos.filter((row) => {
    if (!row.documentId) return false;
    return (
      normalizeWhatsappDigits(row.whatsapp) === digits ||
      normalizeWhatsappDigits(row.telefono) === digits
    );
  });
  const chosen = hits.find((row) => row.published) || hits[0];
  if (!chosen?.documentId) return null;
  return {
    documentId: String(chosen.documentId),
    slug: chosen.slug || '',
    nombre: chosen.nombre || '',
    categoriaId: chosen.categoriaId || categoriaIdOf(chosen),
  };
}

export function mailDeFicha(raw?: string | null): string {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value.length > 254) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '';
  return value;
}

export function assertFichaMinima(input: {
  nombre?: string;
  telefono?: string;
  email?: string;
  categoriaId?: string;
}) {
  if (!String(input.nombre || '').trim()) {
    throw new ValidationError('nombre es requerido');
  }
  if (!normalizeWhatsappDigits(input.telefono || '') && !mailDeFicha(input.email)) {
    throw new ValidationError('teléfono o mail es requerido');
  }
  if (!String(input.categoriaId || '').trim()) {
    throw new ValidationError('categoría es requerida');
  }
}
