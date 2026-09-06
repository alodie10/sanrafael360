import { createNegocioRepository } from '../repositories/negocio-repository';
import { createPagoRepository } from '../../pago/repositories/pago-repository';
import { createUserRepository } from '../../../repositories/user-repository';
import { NotFoundError } from '../../../utils/errors';
import { resolveVigenciaUpdate } from '../../../utils/premium-vigencia';
import { dedupeFavoritos, nextFavoritoIds } from './favoritos-utils';

export function createPortalAdminService(strapi: any) {
  return {
    async getFavoritesForUser(userId: number) {
      const userRepo = createUserRepository(strapi);
      const dbUser = await userRepo.findWithFavoritos(userId);
      return dedupeFavoritos(dbUser?.favoritos || []);
    },

    async toggleFavorite(userId: number, negocioDocumentId: string) {
      const negocioRepo = createNegocioRepository(strapi);
      const userRepo = createUserRepository(strapi);

      const negocio =
        (await negocioRepo.findById(negocioDocumentId, [], 'published')) ||
        (await negocioRepo.findById(negocioDocumentId));
      if (!negocio) throw new NotFoundError('Negocio');

      const dbUser = await userRepo.findById(userId, ['favoritos']);
      const { isFavorited, ids } = nextFavoritoIds(
        dbUser?.favoritos || [],
        negocioDocumentId,
        Number(negocio.id)
      );

      await userRepo.updateFavoritos(userId, ids);

      return {
        action: isFavorited ? ('removed' as const) : ('added' as const),
        documentId: negocioDocumentId,
      };
    },

    async updateVigencia(negocioDocumentId: string, premium_valid_until: string | null) {
      const negocioRepo = createNegocioRepository(strapi);
      const { is_premium, validUntilISO } = resolveVigenciaUpdate(premium_valid_until);

      await negocioRepo.updateDraftAndPublished(negocioDocumentId, {
        is_premium,
        premium_valid_until: validUntilISO,
      });
    },

    async createManualPago(data: {
      monto: number;
      estado?: string;
      fecha_pago?: string;
      external_reference?: string;
      negocio: string;
      extendMonths?: number;
    }) {
      const pagoRepo = createPagoRepository(strapi);
      const negocioRepo = createNegocioRepository(strapi);
      const manualId = `manual_${Date.now()}`;

      const negocioObj = await negocioRepo.findById(data.negocio);
      if (!negocioObj) throw new NotFoundError('Negocio');

      const newPago = await pagoRepo.create({
        monto: data.monto,
        estado: (data.estado as 'aprobado') || 'aprobado',
        fecha_pago: data.fecha_pago ? new Date(data.fecha_pago) : new Date(),
        external_reference: data.external_reference || '',
        mp_preference_id: manualId,
        mp_payment_id: manualId,
        negocio: negocioObj.id,
      });

      if ((data.extendMonths ?? 0) > 0) {
        const now = new Date();
        const validUntil = negocioObj.premium_valid_until
          ? new Date(negocioObj.premium_valid_until)
          : new Date();
        const baseDate = validUntil < now ? now : validUntil;
        baseDate.setMonth(baseDate.getMonth() + (data.extendMonths ?? 0));

        await negocioRepo.updateDraftAndPublished(data.negocio, {
          is_premium: true,
          premium_valid_until: baseDate.toISOString(),
        });
      }

      return newPago;
    },

    async deletePago(documentIdOrNumeric: string) {
      const pagoRepo = createPagoRepository(strapi);
      let targetDocumentId = documentIdOrNumeric;

      if (!Number.isNaN(Number(documentIdOrNumeric))) {
        const pago = await pagoRepo.findByNumericId(Number(documentIdOrNumeric));
        if (!pago) throw new NotFoundError('Pago');
        targetDocumentId = pago.documentId;
      }

      await pagoRepo.delete(targetDocumentId);
    },
  };
}
