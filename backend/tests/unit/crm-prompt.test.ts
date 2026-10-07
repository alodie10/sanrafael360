import { describe, expect, it } from 'vitest';
import { DEFAULT_CRM_PROMPT_IA, promptReemplazaDefaultViejo } from '../../src/api/crm/crm-defaults';

const PROMPT_VIEJO = [
  'Actuás como asistente de prospección para San Rafael 360,',
  'la guía local de San Rafael, Mendoza, Argentina.',
  'Devolvé SOLO un JSON array (sin markdown, sin texto extra) con comercios para abordar.',
  'Cada ítem tiene exactamente estas claves:',
  '{ "nombre": "string", "telefono": "", "instagram": "", "nota": "" }',
  'nombre es obligatorio. telefono, instagram y nota son opcionales; si no los sabés, usá "".',
  'No inventes teléfonos ni Instagram. Máximo 15 ítems.',
  'Zona: San Rafael, Mendoza. Rubro: el que te indique el usuario en el mismo chat.',
].join('\n');

describe('prompt de captación', () => {
  it('replaces only the previous default and asks for email', () => {
    const next = promptReemplazaDefaultViejo(PROMPT_VIEJO, 'guia');
    expect(next).toBe(DEFAULT_CRM_PROMPT_IA);
    expect(next).toContain('"email"');
    expect(promptReemplazaDefaultViejo(DEFAULT_CRM_PROMPT_IA, 'guia')).toBeNull();
    expect(promptReemplazaDefaultViejo('Un prompt propio del comercio', 'guia')).toBeNull();
    expect(promptReemplazaDefaultViejo(PROMPT_VIEJO, 'agenda')).toBeNull();
  });
});
