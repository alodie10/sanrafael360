import { ValidationError } from '../../utils/errors';
import {
  normalizePlantillaSlots,
  pickSlotTexto,
  type PlantillaSlot,
} from '../../utils/plantilla-slots';
import { DEFAULT_CRM_PROMPT_IA } from './crm-defaults';

export type CrmPlantillaInput = {
  mensaje?: string;
  firma?: string;
  prompt_ia?: string;
  slots?: PlantillaSlot[];
  mensajes?: unknown;
};

export function mapCrmPlantilla(plantilla: any) {
  const slots = normalizePlantillaSlots(plantilla?.mensajes, plantilla?.mensaje);
  return {
    mensaje: slots[0].texto,
    firma: plantilla?.firma || '',
    prompt_ia: plantilla?.prompt_ia || DEFAULT_CRM_PROMPT_IA,
    slots,
  };
}

export function plantillaSavePayload(input: CrmPlantillaInput) {
  const slots = normalizePlantillaSlots(input.slots ?? input.mensajes, input.mensaje);
  if (!slots[0].texto) throw new ValidationError('mensaje es requerido');
  const data: Record<string, unknown> = {
    mensaje: slots[0].texto,
    mensajes: slots,
    firma: String(input.firma || '').trim(),
  };
  if (input.prompt_ia != null) {
    data.prompt_ia = String(input.prompt_ia).trim() || DEFAULT_CRM_PROMPT_IA;
  }
  return data;
}

export function mensajeDeSlot(plantilla: any, index: unknown) {
  const slots = normalizePlantillaSlots(plantilla?.mensajes, plantilla?.mensaje);
  const { slot } = pickSlotTexto(slots, index);
  const texto = slot.texto.trim();
  if (!texto) {
    throw new ValidationError(`La plantilla "${slot.titulo}" está vacía`);
  }
  return texto;
}
