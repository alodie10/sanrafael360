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

export function assertPuedeEnviarMail(contacto: any, modo?: string) {
  if (contacto?.no_contactar) {
    throw new ValidationError('Este contacto está marcado como no contactar');
  }
  if (modo === 'agenda') return;
  if (!negocioResumen(contacto)?.documentId) {
    throw new ValidationError('Creá la ficha antes de abrir el mail');
  }
}

export function normalizeCrmEmail(raw: unknown): string | null {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

export function asuntoDeCampana(campana?: string) {
  const titulo = String(campana || '').trim();
  return titulo || 'San Rafael 360';
}

export function buildMailtoUrl(email: unknown, subject: string, body: string): string | null {
  const to = normalizeCrmEmail(email);
  if (!to) return null;
  const query = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`].join('&');
  return `mailto:${to}?${query}`;
}

export const CRM_MAIL_NO_ENVIADO = 'Mail no enviado:';

export function avisoMailSinUrl(hasUrl: boolean) {
  if (hasUrl) return undefined;
  return 'El mail no sirvió. Salió de la cola: en Contactos alcanzados marcá Error.';
}

export function actividadMailConsumioCupo(texto?: string | null) {
  return !String(texto || '').startsWith(CRM_MAIL_NO_ENVIADO);
}

export const CRM_WSP_NO_ENVIADO = 'WhatsApp no enviado:';

export function avisoWhatsappSinUrl(hasUrl: boolean) {
  if (hasUrl) return undefined;
  return 'El teléfono no sirvió. Salió de la cola: en Contactos alcanzados marcá Error WSP.';
}

export function actividadConsumioCupo(texto?: string | null) {
  return !String(texto || '').startsWith(CRM_WSP_NO_ENVIADO);
}
