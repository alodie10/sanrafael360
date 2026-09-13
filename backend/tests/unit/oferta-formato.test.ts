import { describe, it, expect } from 'vitest';

function parseFormatoVisual(value: string | undefined) {
  return value === 'Banners' ? 'Banners' : 'Ficha';
}

function isGalleryStillImage(item: { mime?: string; url?: string; name?: string } | null) {
  if (!item) return false;
  const mime = String(item.mime || '').toLowerCase();
  if (mime.startsWith('video/')) return false;
  if (mime.startsWith('image/')) return true;
  const hint = `${item.url || ''} ${item.name || ''}`.toLowerCase();
  return !/\.(mp4|webm|mov|m4v)(\?|\s|$)/.test(hint);
}

describe('oferta formato visual', () => {
  it('defaults to Ficha', () => {
    expect(parseFormatoVisual(undefined)).toBe('Ficha');
    expect(parseFormatoVisual('Ficha')).toBe('Ficha');
    expect(parseFormatoVisual('Banners')).toBe('Banners');
  });

  it('keeps still images and drops videos', () => {
    expect(isGalleryStillImage({ mime: 'image/jpeg', url: '/a.jpg' })).toBe(true);
    expect(isGalleryStillImage({ mime: 'video/mp4', url: '/a.mp4' })).toBe(false);
    expect(isGalleryStillImage({ url: 'https://res.cloudinary.com/x/video.mp4' })).toBe(false);
  });
});
