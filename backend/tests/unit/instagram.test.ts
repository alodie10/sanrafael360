import { describe, expect, it } from 'vitest';
import {
  applyInstagramFields,
  buildInstagramDmUrl,
  canonicalInstagramUrl,
  extractInstagramHandlesFromText,
  normalizeInstagramUsername,
  resolveInstagramUsername,
} from '../../src/utils/instagram';

describe('normalizeInstagramUsername', () => {
  it('strips @ and lowercases a bare handle', () => {
    expect(normalizeInstagramUsername('@Hotel_Rex2024')).toBe('hotel_rex2024');
  });

  it('extracts the handle from a profile URL with query and slash', () => {
    expect(
      normalizeInstagramUsername('https://www.instagram.com/hotel_rex2024/?hl=es')
    ).toBe('hotel_rex2024');
  });

  it('extracts the handle from ig.me and drops any ?text=', () => {
    expect(normalizeInstagramUsername('https://ig.me/m/ameliadepiedra?text=hola')).toBe(
      'ameliadepiedra'
    );
  });

  it('rejects Instagram post paths that are not a user', () => {
    expect(normalizeInstagramUsername('https://www.instagram.com/p/AbC123/')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(normalizeInstagramUsername('')).toBeNull();
    expect(normalizeInstagramUsername(null)).toBeNull();
  });
});

describe('buildInstagramDmUrl', () => {
  it('builds ig.me/m/usuario without a text query', () => {
    const url = buildInstagramDmUrl('@AmelieDePiedra');
    expect(url).toBe('https://ig.me/m/ameliedepiedra');
    expect(url).not.toContain('?');
    expect(url).not.toContain('text=');
  });

  it('returns null when the handle is invalid', () => {
    expect(buildInstagramDmUrl('https://instagram.com/p/AbC123')).toBeNull();
  });
});

describe('resolveInstagramUsername', () => {
  it('prefers instagram_username over the public URL field', () => {
    expect(
      resolveInstagramUsername({
        instagram_username: 'ficha_oficial',
        instagram: 'https://instagram.com/viejo_handle',
      })
    ).toBe('ficha_oficial');
  });

  it('falls back to the public Instagram URL when username is empty', () => {
    expect(
      resolveInstagramUsername({
        instagram_username: '',
        instagram: 'https://www.instagram.com/suter.petit.hotel/',
      })
    ).toBe('suter.petit.hotel');
  });
});

describe('applyInstagramFields', () => {
  it('normalizes instagram_username in a portal payload', () => {
    const data: Record<string, unknown> = {
      instagram_username: '@Hotel_Rex2024',
      instagram: 'https://instagram.com/hotel_rex2024/',
    };
    applyInstagramFields(data);
    expect(data.instagram_username).toBe('hotel_rex2024');
  });

  it('does not wipe username when the payload has neither field', () => {
    const data: Record<string, unknown> = { trigger_discovery: true };
    applyInstagramFields(data);
    expect(data).not.toHaveProperty('instagram_username');
  });
});

describe('extractInstagramHandlesFromText', () => {
  it('pulls unique profile handles from HTML and ignores posts', () => {
    const html = `
      <a href="https://www.instagram.com/parrilla.de.la.finca/">IG</a>
      <a href="https://instagram.com/p/AbC123/">post</a>
      <p>también instagram.com/PARRILLA.de.la.finca?hl=es</p>
    `;
    expect(extractInstagramHandlesFromText(html)).toEqual(['parrilla.de.la.finca']);
  });
});

describe('canonicalInstagramUrl', () => {
  it('builds a clean profile URL from a messy handle', () => {
    expect(canonicalInstagramUrl('@Hotel_Rex2024')).toBe(
      'https://www.instagram.com/hotel_rex2024/'
    );
  });
});
