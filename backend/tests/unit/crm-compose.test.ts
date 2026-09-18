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
