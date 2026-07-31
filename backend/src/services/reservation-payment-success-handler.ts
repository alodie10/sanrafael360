import { NotFoundError, ValidationError } from '../utils/errors';
import { createReservaRepository } from '../api/reserva/repositories/reserva-repository';
import { sendReservaConfirmacionMail } from '../api/reserva/services/cancel-reserva';

/**
 * Confirma una reserva a partir de un pago MP aprobado.
 * Separado del handler de premium: nunca toca negocio.is_premium.
 */
export async function confirmReservaFromPayment(
  strapi: any,
  externalReference: string,
  paymentId: string
) {
  const repo = createReservaRepository(strapi);
  const paymentIdStr = String(paymentId);

  const byPayment = await repo.findByMpPaymentId(paymentIdStr);
  if (byPayment?.estado === 'confirmada') {
    strapi.log.info(`[ReservaPago] Pago ${paymentIdStr} ya confirmó reserva — skip`);
    return { success: true, duplicate: true, reserva: byPayment };
  }

  const reserva = await repo.findByDocumentId(externalReference);
  if (!reserva) {
    throw new NotFoundError('Reserva');
  }

  if (reserva.estado === 'confirmada') {
    await repo.update(reserva.documentId, { mp_payment_id: paymentIdStr });
    return { success: true, duplicate: true, reserva };
  }

  if (reserva.estado !== 'hold') {
    throw new ValidationError(`Reserva en estado ${reserva.estado}; no se puede confirmar`);
  }

  const updated = await repo.update(reserva.documentId, {
    estado: 'confirmada',
    mp_payment_id: paymentIdStr,
    hold_expires_at: null,
  });

  strapi.log.info(`[ReservaPago] Reserva ${reserva.codigo} confirmada (pago ${paymentIdStr})`);

  try {
    await sendReservaConfirmacionMail(strapi, reserva.documentId);
  } catch (err: any) {
    strapi.log.warn(`[ReservaPago] Mail confirmación falló: ${err.message}`);
  }

  return { success: true, reserva: updated };
}
