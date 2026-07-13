import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../src/utils/errors';
import { createPortalAdminService } from '../../src/api/negocio/services/portal-admin';

const mockNegocioFindById = vi.fn();
const mockNegocioUpdateDraftAndPublished = vi.fn();
const mockUserFindById = vi.fn();
const mockUserUpdateFavoritos = vi.fn();

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
    findWithFavoritos: vi.fn(),
  }),
}));

vi.mock('../../src/api/pago/repositories/pago-repository', () => ({
  createPagoRepository: () => ({}),
}));

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
      mockUserFindById.mockResolvedValue({ favoritos: [{ id: 42 }, { id: 99 }] });

      const service = createPortalAdminService(strapi);
      const result = await service.toggleFavorite(1, 'doc-42');

      expect(result).toEqual({ action: 'removed', documentId: 'doc-42' });
      expect(mockUserUpdateFavoritos).toHaveBeenCalledWith(1, [99]);
    });

    it('throws NotFoundError when negocio is missing', async () => {
      mockNegocioFindById.mockResolvedValue(null);

      const service = createPortalAdminService(strapi);
      await expect(service.toggleFavorite(1, 'missing')).rejects.toThrow(NotFoundError);
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
