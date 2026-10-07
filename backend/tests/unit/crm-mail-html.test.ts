import { describe, expect, it } from 'vitest';
import { renderCrmMailHtml } from '../../src/api/crm/crm-mail-html';

describe('renderCrmMailHtml', () => {
  it('renders the campaign copy and the hosted image on the black and gold layout', () => {
    const html = renderCrmMailHtml({
      saludo: '¡Buenas tardes!',
      nombre: 'MTM Ferretería Industrial',
      mensaje: 'Te escribo de San Rafael 360, la guía local.\nSi te interesa aparecer publicado, te cuento cómo funciona.',
      firma: 'Diego Alonso — sanrafael360.com',
      pieza: {
        titulo: 'Institucional',
        previewUrl: 'https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto/pieza.jpg',
        pageUrl: 'http://localhost:3000/pieza/abc',
      },
    });
    expect(html).toContain('¡Buenas tardes!');
    expect(html).toContain('Hola MTM Ferretería Industrial,');
    expect(html).toContain('Te escribo de San Rafael 360');
    expect(html).toContain('src="https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto/pieza.jpg"');
    expect(html).toContain('#E6B325');
    expect(html).toContain('#000000');
    expect(html).not.toContain('localhost');
    expect(html).not.toContain('<script');
  });

  it('escapes the name and skips an image that is not hosted on https', () => {
    const html = renderCrmMailHtml({
      saludo: 'Hola',
      nombre: '<script>',
      mensaje: 'Texto',
      firma: 'Diego',
      pieza: { previewUrl: 'http://localhost:1337/uploads/a.jpg', pageUrl: 'http://localhost:3000/pieza/x' },
    });
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img');
  });
});
