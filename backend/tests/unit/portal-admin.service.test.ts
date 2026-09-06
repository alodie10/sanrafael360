import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../src/utils/errors';
import { createPortalAdminService } from '../../src/api/negocio/services/portal-admin';
import {
  dedupeFavoritos,
  nextFavoritoIds,
} from '../../src/api/negocio/services/favoritos-utils';

const mockNegocioFindById = vi.fn();
const mockNegocioUpdateDraftAndPublished = vi.fn();
const mockUserFindById = vi.fn();
const mockUserUpdateFavoritos = vi.fn();
const mockUserFindWithFavoritos = vi.fn();

vi.mock('../../src/api/negocio/repositories/negocio-repository', () => ({
  createNegocioRepository: () => ({
    findById: mockNegocioFindById,
    updateDraftAndPublished: mockNegocioUpdateDraftAndPublished,
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
  createPagoRepository: () => ({}),
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
});
