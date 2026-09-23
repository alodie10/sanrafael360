import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../src/utils/errors';
import { createPortalAdminService } from '../../src/api/negocio/services/portal-admin';
import {
  dedupeFavoritos,
  nextFavoritoIds,
} from '../../src/api/negocio/services/favoritos-utils';

const mockNegocioFindById = vi.fn();
const mockNegocioUpdateDraftAndPublished = vi.fn();
const mockNegocioFindPublishedWithPagos = vi.fn();
const mockUserFindById = vi.fn();
const mockUserUpdateFavoritos = vi.fn();
const mockUserFindWithFavoritos = vi.fn();
const mockPagoFindAllForAdmin = vi.fn();
const mockFindComercioByNegocio = vi.fn();
const mockFindComercioByOwnerEmail = vi.fn();
const mockFindComercioBySlug = vi.fn();
const mockCreateComercio = vi.fn();
const mockUpdateComercio = vi.fn();
const mockFindPlantillaByComercio = vi.fn();
const mockCreatePlantilla = vi.fn();

vi.mock('../../src/api/negocio/repositories/negocio-repository', () => ({
  createNegocioRepository: () => ({
    findById: mockNegocioFindById,
    updateDraftAndPublished: mockNegocioUpdateDraftAndPublished,
    findPublishedWithPagos: mockNegocioFindPublishedWithPagos,
  }),
}));

vi.mock('../../src/repositories/user-repository', () => ({
  createUserRepository: () => ({
    findById: mockUserFindById,
    updateFavoritos: mockUserUpdateFavoritos,
    findWithFavoritos: mockUserFindWithFavoritos,
  }),
}));

vi.mock('../../src/api/pago/repositories/pago-repository', () => ({
  createPagoRepository: () => ({
    findAllForAdmin: mockPagoFindAllForAdmin,
  }),
}));

vi.mock('../../src/api/crm/repositories/crm-repository', () => ({
  createCrmRepository: () => ({
    findComercioByNegocio: mockFindComercioByNegocio,
    findComercioByOwnerEmail: mockFindComercioByOwnerEmail,
    findComercioBySlug: mockFindComercioBySlug,
    createComercio: mockCreateComercio,
    updateComercio: mockUpdateComercio,
    findPlantillaByComercio: mockFindPlantillaByComercio,
    createPlantilla: mockCreatePlantilla,
  }),
}));

describe('favoritos-utils', () => {
  it('dedupes draft and published rows of the same document', () => {
    const result = dedupeFavoritos([
      { id: 41, documentId: 'doc-42', nombre: 'Casa Cielo', publishedAt: null },
      { id: 42, documentId: 'doc-42', nombre: 'Casa Cielo', publishedAt: '2026-01-01' },
      { id: 99, document_id: 'doc-99', nombre: 'Belmont', publishedAt: '2026-01-01' },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.documentId)).toEqual(['doc-42', 'doc-99']);
    expect(result[0].id).toBe(42);
  });

  it('removes every numeric id of the same document when toggling off', () => {
    const { isFavorited, ids } = nextFavoritoIds(
      [
        { id: 41, documentId: 'doc-42' },
        { id: 42, documentId: 'doc-42' },
        { id: 99, documentId: 'doc-99' },
      ],
      'doc-42',
      42
    );

    expect(isFavorited).toBe(true);
    expect(ids).toEqual([99]);
  });
});

describe('portal-admin service', () => {
  const strapi = { log: { info: vi.fn(), error: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleFavorite', () => {
    it('adds negocio when not favorited', async () => {
      mockNegocioFindById.mockResolvedValue({ id: 42, documentId: 'doc-42' });
      mockUserFindById.mockResolvedValue({ favoritos: [] });

      const service = createPortalAdminService(strapi);
      const result = await service.toggleFavorite(1, 'doc-42');

      expect(result).toEqual({ action: 'added', documentId: 'doc-42' });
      expect(mockUserUpdateFavoritos).toHaveBeenCalledWith(1, [42]);
    });

    it('removes negocio when already favorited', async () => {
      mockNegocioFindById.mockResolvedValue({ id: 42, documentId: 'doc-42' });
      mockUserFindById.mockResolvedValue({ favoritos: [{ id: 42, documentId: 'doc-42' }, { id: 99, documentId: 'doc-99' }] });

      const service = createPortalAdminService(strapi);
      const result = await service.toggleFavorite(1, 'doc-42');

      expect(result).toEqual({ action: 'removed', documentId: 'doc-42' });
      expect(mockUserUpdateFavoritos).toHaveBeenCalledWith(1, [99]);
    });

    it('does not add a second id when draft and published of the same document are linked', async () => {
      mockNegocioFindById.mockResolvedValue({ id: 42, documentId: 'doc-42' });
      mockUserFindById.mockResolvedValue({
        favoritos: [
          { id: 41, documentId: 'doc-42' },
          { id: 99, documentId: 'doc-99' },
        ],
      });

      const service = createPortalAdminService(strapi);
      const result = await service.toggleFavorite(1, 'doc-42');

      expect(result.action).toBe('removed');
      expect(mockUserUpdateFavoritos).toHaveBeenCalledWith(1, [99]);
    });

    it('throws NotFoundError when negocio is missing', async () => {
      mockNegocioFindById.mockResolvedValue(null);

      const service = createPortalAdminService(strapi);
      await expect(service.toggleFavorite(1, 'missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFavoritesForUser', () => {
    it('returns one card per documentId', async () => {
      mockUserFindWithFavoritos.mockResolvedValue({
        favoritos: [
          { id: 41, documentId: 'doc-42', nombre: 'Casa Cielo' },
          { id: 42, documentId: 'doc-42', nombre: 'Casa Cielo', publishedAt: '2026-01-01' },
        ],
      });

      const service = createPortalAdminService(strapi);
      const result = await service.getFavoritesForUser(1);

      expect(result).toHaveLength(1);
      expect(result[0].documentId).toBe('doc-42');
    });
  });

  describe('listAdminPagos', () => {
    it('returns stats from all pagos even if the table is filtered', async () => {
      mockNegocioFindPublishedWithPagos.mockResolvedValue([
        {
          nombre: 'Activo',
          is_premium: true,
          premium_valid_until: '2099-01-01T00:00:00.000Z',
          pagos: [{ monto: 1000, estado: 'aprobado', fecha_pago: '2026-03-01T12:00:00.000Z' }],
        },
      ]);
      mockPagoFindAllForAdmin.mockResolvedValue([
        { monto: 1000, estado: 'aprobado', fecha_pago: '2026-03-01T12:00:00.000Z' },
        { monto: 4000, estado: 'aprobado', fecha_pago: '2025-12-01T12:00:00.000Z' },
      ]);

      const service = createPortalAdminService(strapi);
      const result = await service.listAdminPagos({ filterType: 'premium' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.stats.total).toBe(5000);
    });
  });

  describe('updateVigencia', () => {
    it('delegates premium update to repository', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const service = createPortalAdminService(strapi);
      await service.updateVigencia('doc-1', dateStr);

      expect(mockNegocioUpdateDraftAndPublished).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({ is_premium: true })
      );
    });
  });

  describe('updateProspectorVigencia', () => {
    it('writes prospector vigencia and provisions the agenda CRM', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);
      const dateStr = tomorrow.toISOString().split('T')[0];
      mockNegocioFindById.mockResolvedValue({
        documentId: 'doc-1',
        nombre: 'Argendeli',
        slug: 'argendeli',
        owner: { email: 'argendeli01@gmail.com' },
      });
      mockFindComercioByNegocio.mockResolvedValue(null);
      mockFindComercioByOwnerEmail.mockResolvedValue(null);
      mockFindComercioBySlug.mockResolvedValue(null);
      mockFindPlantillaByComercio.mockResolvedValue(null);
      mockCreateComercio.mockResolvedValue({
        documentId: 'c1',
        nombre: 'Argendeli',
        slug: 'argendeli',
        modo: 'agenda',
        owner_email: 'argendeli01@gmail.com',
        activo: true,
      });

      const service = createPortalAdminService(strapi);
      await service.updateProspectorVigencia('doc-1', dateStr);

      expect(mockNegocioUpdateDraftAndPublished).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({ is_prospector: true })
      );
      expect(mockCreateComercio).toHaveBeenCalledWith(
        expect.objectContaining({
          modo: 'agenda',
          owner_email: 'argendeli01@gmail.com',
          cupo_wsp_limite: 25,
        })
      );
    });
  });
});
