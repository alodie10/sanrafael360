import { ValidationError } from '../../utils/errors';
import { negocioResumen } from './crm-ficha';

export function assertPuedeEnviarWhatsapp(contacto: any, modo?: string) {
  if (contacto?.no_contactar) {
    throw new ValidationError('Este contacto está marcado como no contactar');
  }
  if (modo === 'agenda') return;
  if (!negocioResumen(contacto)?.documentId) {
    throw new ValidationError('Creá la ficha antes de abrir WhatsApp');
  }
}

export function patchTrasWhatsapp(estado: string, hasUrl: boolean) {
  const data: Record<string, unknown> = { en_cola: false };
  if (hasUrl && estado === 'nuevo') data.estado = 'contactado';
  return data;
}

export const CRM_WSP_NO_ENVIADO = 'WhatsApp no enviado:';

export function avisoWhatsappSinUrl(hasUrl: boolean) {
  if (hasUrl) return undefined;
  return 'El teléfono no sirvió. Salió de la cola: en Contactos alcanzados marcá Error WSP.';
}

export function actividadConsumioCupo(texto?: string | null) {
  return !String(texto || '').startsWith(CRM_WSP_NO_ENVIADO);
}
