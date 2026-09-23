import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import { mapCrmPlantilla, mensajeDeSlot, plantillaSavePayload } from '../../src/api/crm/crm-plantilla-map';

describe('crm-plantilla-map', () => {
  it('maps five slots and keeps the first as mensaje', () => {
    const mapped = mapCrmPlantilla({
      mensaje: 'Viejo',
      firma: 'Diego',
      mensajes: [{ titulo: 'Institucional', texto: 'Guía local' }, { titulo: 'Promo', texto: '2x1' }],
    });
    expect(mapped.mensaje).toBe('Guía local');
    expect(mapped.slots[1].texto).toBe('2x1');
    expect(mapped.slots).toHaveLength(5);
  });

  it('stores slots and mensaje together', () => {
    const payload = plantillaSavePayload({
      firma: 'Jaditek',
      slots: [
        { titulo: 'Institucional', texto: 'Hola, te escribo de Jaditek.' },
        { titulo: 'Promo', texto: 'Tenemos 2x1' },
      ],
    });
    expect(payload.mensaje).toBe('Hola, te escribo de Jaditek.');
    expect((payload.mensajes as { texto: string }[])[1].texto).toBe('Tenemos 2x1');
  });

  it('rejects sending an empty slot', () => {
    expect(() => mensajeDeSlot({ mensaje: 'Hola' }, 2)).toThrow(ValidationError);
    expect(mensajeDeSlot({ mensaje: 'Hola' }, 0)).toBe('Hola');
  });
});
