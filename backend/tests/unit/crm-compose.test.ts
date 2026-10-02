import { describe, expect, it } from 'vitest';
import { composeCrmMensaje } from '../../src/api/crm/crm-compose';

describe('composeCrmMensaje', () => {
  it('joins saludo, hola, body and firma', () => {
    const text = composeCrmMensaje({
      saludo: '¡Buen día!',
      nombre: 'Taller X',
      mensaje: 'Te escribo de la guía.',
      firma: 'Diego',
    });
    expect(text).toContain('¡Buen día!');
    expect(text).toContain('Hola Taller X,');
    expect(text).toContain('Te escribo de la guía.');
    expect(text).toContain('Diego');
  });

  it('appends the public banner link on its own line', () => {
    const text = composeCrmMensaje({
      saludo: 'Buen día',
      nombre: 'Negocio',
      mensaje: 'Te dejo la propuesta.',
      firma: 'Diego',
      piezaUrl: 'https://www.sanrafael360.com/pieza/abc123',
    });
    expect(text.endsWith('https://www.sanrafael360.com/pieza/abc123')).toBe(true);
    expect(text.split('\n\n').at(-1)).toBe('https://www.sanrafael360.com/pieza/abc123');
  });

  it('skips empty firma', () => {
    const text = composeCrmMensaje({
      saludo: 'Hola',
      nombre: 'A',
      mensaje: 'M',
      firma: '  ',
    });
    expect(text.endsWith('M')).toBe(true);
  });
});
