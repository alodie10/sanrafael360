import { NotFoundError, ValidationError } from '../utils/errors';
import { createReservaRepository } from '../api/reserva/repositories/reserva-repository';
import { sendReservaConfirmacionMail } from '../api/reserva/services/cancel-reserva';

/**
 * Confirma una reserva online con pago en el local (sin MP).
 * Bloquea el hueco; no genera mp_payment_id ni refund.
 */
export async function confirmReservaPagoEnLocal(strapi: any, reservaDocumentId: string) {
  const repo = createReservaRepository(strapi);
  const reserva = await repo.findByDocumentId(reservaDocumentId);
  if (!reserva) throw new NotFoundError('Reserva');

  if (reserva.estado === 'confirmada') {
    return { success: true, duplicate: true, reserva };
  }
  if (reserva.estado !== 'hold' && reserva.estado !== 'expirada') {
    throw new ValidationError(`Reserva en estado ${reserva.estado}; no se puede confirmar`);
  }

  const updated = await repo.update(reserva.documentId, {
    estado: 'confirmada',
    excepcion_sin_pago: true,
    hold_expires_at: null,
  });

  strapi.log.info(`[ReservaPago] Reserva ${reserva.codigo} confirmada (pago en local)`);

  try {
    await sendReservaConfirmacionMail(strapi, reserva.documentId);
  } catch (err: any) {
    strapi.log.warn(`[ReservaPago] Mail confirmación falló: ${err.message}`);
  }

  return { success: true, reserva: updated };
}

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

  // hold = flujo normal; expirada = webhook/pago tardío tras TTL (cliente ya pagó).
  if (reserva.estado !== 'hold' && reserva.estado !== 'expirada') {
    throw new ValidationError(`Reserva en estado ${reserva.estado}; no se puede confirmar`);
  }

  if (reserva.estado === 'expirada') {
    strapi.log.warn(
      `[ReservaPago] Confirmando ${reserva.codigo} desde expirada (pago ${paymentIdStr} aprobado)`
    );
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
