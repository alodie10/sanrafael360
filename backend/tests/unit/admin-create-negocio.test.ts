import { describe, it, expect, vi, beforeEach } from 'vitest';
import { slugifyNegocioNombre, uniqueNegocioSlug } from '../../src/api/negocio/services/negocio-utils';
import {
  buildAdminCreateExtras,
  sanitizeSchedules,
} from '../../src/api/negocio/services/admin-create-negocio-fields';

const mockFindCategoriaByDocumentId = vi.fn();
const mockSlugTaken = vi.fn();
const mockFindByGooglePlaceId = vi.fn();
const mockCreate = vi.fn();

vi.mock('../../src/api/negocio/repositories/negocio-repository', () => ({
  createNegocioRepository: () => ({
    findCategoriaByDocumentId: mockFindCategoriaByDocumentId,
    slugTaken: mockSlugTaken,
    findByGooglePlaceId: mockFindByGooglePlaceId,
    create: mockCreate,
  }),
}));

describe('slugifyNegocioNombre', () => {
  it('normaliza acentos y puntuación', () => {
    expect(slugifyNegocioNombre('Café & Bar San Rafael')).toBe('cafe-bar-san-rafael');
  });
});

describe('uniqueNegocioSlug', () => {
  it('keeps the base slug when free', async () => {
    const slug = await uniqueNegocioSlug(async () => false, 'Finca Los Álamos');
    expect(slug).toBe('finca-los-alamos');
  });

  it('appends a suffix when the base is taken', async () => {
    const taken = new Set(['taller-sur', 'taller-sur-2']);
    const slug = await uniqueNegocioSlug(async (candidate) => taken.has(candidate), 'Taller Sur');
    expect(slug).toBe('taller-sur-3');
  });
});

describe('buildAdminCreateExtras', () => {
  it('maps Places fields used by admin import', () => {
    const extras = buildAdminCreateExtras({
      whatsapp: '2604498128',
      website: 'https://aldente.example',
      google_maps_url: 'https://maps.google.com/?cid=1',
      google_place_id: 'ChIJtest',
      google_rating: 4.6,
      google_review_count: 33,
      latitud: -34.6086324,
      longitud: -68.3352048,
      schedules: [
        { day: 'Lunes', opening_time: '09:00:00', closing_time: '13:00:00', is_closed: false },
        { day: 'Nope', opening_time: '09:00:00', closing_time: '13:00:00' },
      ],
    });

    expect(extras).toMatchObject({
      whatsapp: '2604498128',
      website: 'https://aldente.example/',
      google_place_id: 'ChIJtest',
      google_rating: 4.6,
      google_review_count: 33,
      discovery_pending: false,
    });
    expect(extras.schedules).toHaveLength(1);
  });

  it('drops invalid schedule days', () => {
    expect(sanitizeSchedules([{ day: 'Monday' }])).toBeUndefined();
  });
});

describe('adminCreateNegocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindCategoriaByDocumentId.mockResolvedValue({
      documentId: 'cat-1',
      nombre: 'Gastronomía',
    });
    mockSlugTaken.mockResolvedValue(false);
    mockFindByGooglePlaceId.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      documentId: 'neg-1',
      nombre: 'AL DENTE Pastas Caseras',
      slug: 'al-dente-pastas-caseras',
    });
  });

  it('persists Places extras on the admin create path', async () => {
    const { adminCreateNegocio } = await import(
      '../../src/api/negocio/services/admin-create-negocio'
    );
    await adminCreateNegocio({}, {
      nombre: 'AL DENTE Pastas Caseras',
      categoriaId: 'cat-1',
      google_place_id: 'ChIJtest',
      latitud: -34.6,
      longitud: -68.3,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        google_place_id: 'ChIJtest',
        latitud: -34.6,
        longitud: -68.3,
        reclamar_habilitado: true,
      }),
      'published'
    );
  });

  it('rejects a duplicate google_place_id', async () => {
    mockFindByGooglePlaceId.mockResolvedValue({ nombre: 'AL DENTE Pastas Caseras' });
    const { adminCreateNegocio } = await import(
      '../../src/api/negocio/services/admin-create-negocio'
    );

    await expect(
      adminCreateNegocio({}, {
        nombre: 'AL DENTE Pastas Caseras',
        categoriaId: 'cat-1',
        google_place_id: 'ChIJtest',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('AL DENTE Pastas Caseras'),
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
