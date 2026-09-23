import { slotsFromMensaje } from '../../utils/plantilla-slots';

export const CRM_TENANT_SLUG = 'sr360';

export type CrmModo = 'guia' | 'agenda';

export const DEFAULT_CRM_PROMPT_IA = [
  'Actuás como asistente de prospección para San Rafael 360,',
  'la guía local de San Rafael, Mendoza, Argentina.',
  'Devolvé SOLO un JSON array (sin markdown, sin texto extra) con comercios para abordar.',
  'Cada ítem tiene exactamente estas claves:',
  '{ "nombre": "string", "telefono": "", "instagram": "", "nota": "" }',
  'nombre es obligatorio. telefono, instagram y nota son opcionales; si no los sabés, usá "".',
  'No inventes teléfonos ni Instagram. Máximo 15 ítems.',
  'Zona: San Rafael, Mendoza. Rubro: el que te indique el usuario en el mismo chat.',
].join('\n');

export const DEFAULT_AGENDA_PROMPT_IA = [
  'Actuás como asistente para armar una lista de contactos de este negocio.',
  'No uses la guía San Rafael 360 ni inventes fichas de la ciudad.',
  'Devolvé SOLO un JSON array (sin markdown, sin texto extra).',
  'Cada ítem tiene exactamente estas claves:',
  '{ "nombre": "string", "telefono": "", "instagram": "", "nota": "" }',
  'nombre es obligatorio. telefono, instagram y nota son opcionales; si no los sabés, usá "".',
  'No inventes teléfonos ni Instagram. Máximo 15 ítems.',
  'El rubro y la zona te los indica el usuario en el mismo chat.',
].join('\n');

export const DEFAULT_CRM_MENSAJE = [
  'Te escribo de San Rafael 360, la guía local.',
  'Si te interesa aparecer publicado, te cuento cómo funciona.',
].join('\n');

export const DEFAULT_CRM_FIRMA = 'Diego Alonso — sanrafael360.com';

export function plantillaDefaults(modo: CrmModo, nombre: string) {
  if (modo === 'agenda') {
    const label = String(nombre || '').trim() || 'nuestro comercio';
    const mensaje = `Hola, te escribo de ${label}.`;
    return {
      mensaje,
      firma: label,
      prompt_ia: DEFAULT_AGENDA_PROMPT_IA,
      mensajes: slotsFromMensaje(mensaje),
    };
  }
  return {
    mensaje: DEFAULT_CRM_MENSAJE,
    firma: DEFAULT_CRM_FIRMA,
    prompt_ia: DEFAULT_CRM_PROMPT_IA,
    mensajes: slotsFromMensaje(DEFAULT_CRM_MENSAJE),
  };
}
