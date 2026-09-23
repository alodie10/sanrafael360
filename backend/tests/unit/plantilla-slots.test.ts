import { describe, expect, it } from 'vitest';
import {
  normalizePlantillaSlots,
  parsePlantillaIndex,
  pickSlotTexto,
  slotsFromMensaje,
} from '../../src/utils/plantilla-slots';

describe('plantilla-slots', () => {
  it('fills five named slots from a single mensaje', () => {
    const slots = slotsFromMensaje('Hola institucional');
    expect(slots).toHaveLength(5);
    expect(slots[0]).toEqual({ titulo: 'Institucional', texto: 'Hola institucional' });
    expect(slots[1].titulo).toBe('Prospectar');
    expect(slots[1].texto).toBe('');
  });

  it('keeps custom titles and backfills slot 0 from the legacy mensaje', () => {
    const slots = normalizePlantillaSlots(
      [{ titulo: 'Institucional SR360', texto: '' }, { titulo: 'Promo finde', texto: '2x1' }],
      'Mensaje viejo'
    );
    expect(slots[0].titulo).toBe('Institucional SR360');
    expect(slots[0].texto).toBe('Mensaje viejo');
    expect(slots[1]).toEqual({ titulo: 'Promo finde', texto: '2x1' });
  });

  it('clamps the selected index', () => {
    expect(parsePlantillaIndex(3)).toBe(3);
    expect(parsePlantillaIndex(-1)).toBe(0);
    expect(parsePlantillaIndex(99)).toBe(0);
    expect(parsePlantillaIndex('2')).toBe(2);
    const slots = slotsFromMensaje('A');
    expect(pickSlotTexto(slots, 4).slot.titulo).toBe('Cierre');
  });
});
