import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/utils/errors';
import {
  absoluteMediaUrl,
  assertPiezaImage,
  assertPlantillaSlotIndex,
  isPiezaToken,
  mapCrmPieza,
  whatsappPreviewImage,
} from '../../src/api/crm/crm-pieza';

describe('crm-pieza', () => {
  it('rejects a bad slot and a non-image', () => {
    expect(assertPlantillaSlotIndex('2')).toBe(2);
    expect(() => assertPlantillaSlotIndex('9')).toThrow(ValidationError);
    expect(() => assertPiezaImage({ mimetype: 'application/pdf', size: 100 })).toThrow(ValidationError);
    expect(() => assertPiezaImage({ mimetype: 'image/png', size: 9 * 1024 * 1024 })).toThrow(
      ValidationError
    );
    expect(() => assertPiezaImage({ mimetype: 'image/jpeg', size: 1200 })).not.toThrow();
  });

  it('accepts only opaque tokens', () => {
    expect(isPiezaToken('abc_DEF-1234567')).toBe(true);
    expect(isPiezaToken('../etc')).toBe(false);
    expect(isPiezaToken('short')).toBe(false);
  });

  it('builds an absolute image and a WhatsApp-sized preview', () => {
    expect(absoluteMediaUrl('/uploads/banner.jpg', 'https://media.example')).toBe(
      'https://media.example/uploads/banner.jpg'
    );
    const cloud =
      'https://res.cloudinary.com/demo/image/upload/v1/banner.jpg';
    expect(whatsappPreviewImage(cloud)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto,c_limit,w_1200/v1/banner.jpg'
    );
    expect(whatsappPreviewImage('https://media.example/banner.png')).toBe(
      'https://media.example/banner.png'
    );
  });

  it('maps a public page from the stored media', () => {
    const previous = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://www.sanrafael360.com';
    const mapped = mapCrmPieza({
      token: 'tokenpieza01',
      titulo: 'Oferta',
      slot_index: 3,
      imagen: {
        url: 'https://res.cloudinary.com/demo/image/upload/v1/flyer.jpg',
        width: 800,
        height: 1400,
      },
    });
    expect(mapped?.pageUrl).toBe('https://www.sanrafael360.com/pieza/tokenpieza01');
    expect(mapped?.previewUrl).toContain('f_jpg,q_auto,c_limit,w_1200');
    expect(mapped?.titulo).toBe('Oferta');
    expect(mapped?.width).toBeNull();
    if (previous == null) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous;
  });
});
