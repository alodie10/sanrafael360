import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';
import { createReservaRepository } from '../repositories/reserva-repository';
import { createNotificationService } from '../../../services/notification-service';
import { buildReservaCancelUrl } from './cancel-token';
import {
  reservaCancelacionEmail,
  reservaConfirmacionEmail,
} from './templates/reserva-email-templates';

type CancelPoliticaTramo = {
  reembolso_porcentaje?: number;
  cargo_fijo_ars?: number | null;
  permitir_self_service?: boolean;
};

type CancelPolitica = {
  dentro_ventana?: CancelPoliticaTramo;
  fuera_ventana?: CancelPoliticaTramo;
};

type MpRefundResult = { id: string; alreadyRefunded: boolean };

function resolveMpToken(envName?: string | null): string | null {
  if (!envName) return process.env.MP_ACCESS_TOKEN || null;
  return process.env[envName] || process.env.MP_ACCESS_TOKEN || null;
}

function mpErrorCode(err: any): number | null {
  const cause = err?.cause;
  const first = Array.isArray(cause) ? cause[0] : cause;
  const code = first?.code ?? err?.code;
  return code != null ? Number(code) : null;
}

function isAlreadyRefundedStatus(status?: string | null): boolean {
  return status === 'refunded' || status === 'charged_back';
}

function hoursUntil(inicioIso: string): number {
  return (new Date(inicioIso).getTime() - Date.now()) / (1000 * 60 * 60);
}

function formatCuando(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timeZone || 'America/Argentina/Mendoza',
  }).format(new Date(iso));
}

function computeRefundAmount(
  monto: number,
  tramo: CancelPoliticaTramo | undefined
): number {
  const pct = Number(tramo?.reembolso_porcentaje ?? 0);
  const cargo = Number(tramo?.cargo_fijo_ars ?? 0);
  const raw = (monto * pct) / 100 - cargo;
  return Math.max(0, Math.round(raw * 100) / 100);
}

export async function sendReservaConfirmacionMail(strapi: any, reservaDocumentId: string) {
  const repo = createReservaRepository(strapi);
  const reserva = await repo.findByDocumentId(reservaDocumentId, {
    comercio: true,
    recurso: true,
  });
  if (!reserva?.cliente_email) return false;

  const comercio = reserva.comercio;
  const cancelUrl =
    comercio?.slug && reserva.documentId
      ? buildReservaCancelUrl(reserva.documentId, comercio.slug)
      : null;

  const mail = reservaConfirmacionEmail({
    clienteNombre: reserva.cliente_nombre || 'hola',
    comercioNombre: comercio?.nombre_publico || comercio?.nombre || 'Reservas',
    recursoNombre: reserva.recurso?.nombre || 'Turno',
    cuando: formatCuando(reserva.inicio, comercio?.timezone),
    codigo: reserva.codigo,
    textoLlegada: comercio?.texto_llegada,
    cancelUrl,
  });

  const notifications = createNotificationService(strapi);
  return notifications.sendEmail({
    to: reserva.cliente_email,
    subject: mail.subject,
    html: mail.html,
  });
}

async function findExistingMpRefundId(
  accessToken: string,
  paymentId: string
): Promise<string | null> {
  const client = new MercadoPagoConfig({ accessToken });
  const refunds = new PaymentRefund(client);
  try {
    const list: any = await refunds.list({ payment_id: paymentId });
    const rows = Array.isArray(list)
      ? list
      : list?.data || list?.results || (list?.[0] ? [list[0]] : []);
    const first = rows.find((r: any) => r && r.id != null) || rows[0];
    return first?.id != null ? String(first.id) : null;
  } catch {
    return null;
  }
}

async function readMpPayment(accessToken: string, paymentId: string): Promise<any | null> {
  try {
    const client = new MercadoPagoConfig({ accessToken });
    return await new Payment(client).get({ id: paymentId });
  } catch {
    return null;
  }
}

/**
 * Reembolsa en MP, o reconoce un refund ya hecho en la UI (APP_USR test
 * a menudo falla POST /refunds con code 7 aunque el panel sí pueda devolver).
 */
async function ensureMercadoPagoRefund(params: {
  strapi: any;
  accessToken: string;
  paymentId: string;
  amount: number;
  fullRefund: boolean;
}): Promise<MpRefundResult> {
  const { accessToken, paymentId } = params;
  const refunds = new PaymentRefund(new MercadoPagoConfig({ accessToken }));

  const markAlreadyRefunded = async (): Promise<MpRefundResult> => {
    const existingId =
      (await findExistingMpRefundId(accessToken, paymentId)) || `ui_refund_${paymentId}`;
    return { id: existingId, alreadyRefunded: true };
  };

  let payment = await readMpPayment(accessToken, paymentId);
  if (isAlreadyRefundedStatus(payment?.status)) {
    return markAlreadyRefunded();
  }

  try {
    const result: any = params.fullRefund
      ? await refunds.total({ payment_id: paymentId })
      : await refunds.create({
          payment_id: paymentId,
          body: { amount: params.amount },
        });
    return {
      id: result?.id != null ? String(result.id) : `refund_${Date.now()}`,
      alreadyRefunded: false,
    };
  } catch (err: any) {
    payment = await readMpPayment(accessToken, paymentId);
    if (isAlreadyRefundedStatus(payment?.status)) {
      params.strapi.log.info(
        `[ReservaCancel] Pago ${paymentId} ya reembolsado en MP; se omite API refund`
      );
      return markAlreadyRefunded();
    }

    // Si listamos refunds aprobados aunque get falle/status raro, también liberamos.
    const listedId = await findExistingMpRefundId(accessToken, paymentId);
    if (listedId) {
      params.strapi.log.info(
        `[ReservaCancel] Pago ${paymentId} tiene refund ${listedId} en MP; se omite API refund`
      );
      return { id: listedId, alreadyRefunded: true };
    }

    const code = mpErrorCode(err);
    const msg = String(err?.message || 'error desconocido');
    params.strapi.log.error(`[ReservaCancel] Refund MP falló: ${msg} (code=${code ?? 'n/a'})`);

    if (code === 7 || /live credentials/i.test(msg)) {
      throw new ValidationError(
        `Mercado Pago no permite reembolsar por API con estas credenciales de prueba. ` +
          `Devolvé el pago ${paymentId} desde la cuenta de prueba en MP y volvé a pulsar Cancelar.`
      );
    }

    throw new ValidationError(`No se pudo reembolsar en Mercado Pago: ${msg}`);
  }
}

export async function cancelReserva(params: {
  strapi: any;
  reservaDocumentId: string;
  actor: 'admin' | 'self';
  comercioSlug?: string;
}) {
  const { strapi, reservaDocumentId, actor } = params;
  const repo = createReservaRepository(strapi);
  const reserva = await repo.findByDocumentId(reservaDocumentId, {
    comercio: true,
    recurso: true,
  });

  if (!reserva) throw new NotFoundError('Reserva');
  if (params.comercioSlug && reserva.comercio?.slug !== params.comercioSlug) {
    throw new NotFoundError('Reserva');
  }

  if (reserva.estado === 'cancelada') {
    return { success: true, duplicate: true, reserva, refundAmount: 0 };
  }
  if (reserva.estado === 'expirada') {
    throw new ValidationError('La reserva ya expiró');
  }
  if (reserva.estado !== 'confirmada' && reserva.estado !== 'hold') {
    throw new ValidationError(`No se puede cancelar una reserva en estado ${reserva.estado}`);
  }

  const comercio = reserva.comercio;
  if (!comercio) throw new NotFoundError('Comercio de reservas');

  const horasMin = Number(comercio.cancelacion_horas_minimas ?? 24);
  const horas = hoursUntil(reserva.inicio);
  const dentroVentana = horas >= horasMin;
  const politica = (comercio.cancelacion_politica || {}) as CancelPolitica;
  const tramo = dentroVentana ? politica.dentro_ventana : politica.fuera_ventana;

  if (actor === 'self' && !dentroVentana) {
    if (tramo?.permitir_self_service !== true) {
      throw new ForbiddenError(
        `Solo se puede cancelar online hasta ${horasMin} h antes del turno. Contactá al local.`
      );
    }
  }

  const monto = Number(reserva.monto_ars) || 0;
  const refundAmount = computeRefundAmount(monto, tramo);
  const paymentId = reserva.mp_payment_id ? String(reserva.mp_payment_id) : '';
  const isSimulated = paymentId.startsWith('SIMULATED');
  const canRefundMp =
    refundAmount > 0 &&
    !!paymentId &&
    !isSimulated &&
    !reserva.excepcion_sin_pago;

  let mpRefundId: string | null = null;
  let reembolsoNota: string | null = null;

  if (canRefundMp) {
    const token = resolveMpToken(comercio.mp_token_env);
    if (!token) {
      if (actor === 'admin') {
        reembolsoNota = `Hueco liberado. No hay token MP; si corresponde, reembolsá a mano el pago ${paymentId}.`;
      } else {
        throw new ValidationError('No hay token MP para reembolsar');
      }
    } else {
      const full = refundAmount >= monto;
      try {
        const result = await ensureMercadoPagoRefund({
          strapi,
          accessToken: token,
          paymentId,
          amount: refundAmount,
          fullRefund: full,
        });
        mpRefundId = result.id;
        if (result.alreadyRefunded) {
          reembolsoNota =
            'El reembolso ya figuraba en Mercado Pago; se liberó el turno en la agenda.';
        } else {
          reembolsoNota = full
            ? 'Se procesó el reembolso total en Mercado Pago.'
            : `Se procesó un reembolso parcial de $${refundAmount} en Mercado Pago.`;
        }
      } catch (err: any) {
        // Admin gestiona MP a mano (APP_USR test a menudo no permite POST /refunds).
        if (actor === 'admin') {
          strapi.log.warn(`[ReservaCancel] Admin liberó sin refund API: ${err?.message}`);
          reembolsoNota =
            `Hueco liberado. Reembolsá en Mercado Pago el pago ${paymentId} si corresponde ` +
            `(la API de prueba puede no permitir devoluciones automáticas).`;
        } else {
          throw err;
        }
      }
    }
  } else if (refundAmount <= 0) {
    reembolsoNota = 'Esta cancelación no incluye reembolso según la política del comercio.';
  } else if (isSimulated || reserva.excepcion_sin_pago) {
    reembolsoNota = 'Reserva sin cobro MP (simulación o walk-in); no hubo reembolso.';
  }

  const updated = await repo.update(reservaDocumentId, {
    estado: 'cancelada',
    cancelada_at: new Date().toISOString(),
    mp_refund_id: mpRefundId,
  });

  const notifications = createNotificationService(strapi);

  if (reserva.cliente_email) {
    const mail = reservaCancelacionEmail({
      clienteNombre: reserva.cliente_nombre || 'hola',
      comercioNombre: comercio.nombre_publico || comercio.nombre,
      codigo: reserva.codigo,
      reembolsoNota,
    });
    await notifications.sendEmail({
      to: reserva.cliente_email,
      subject: mail.subject,
      html: mail.html,
    });
  }

  // Aviso a admins: cancelación (self o portal) quedó registrada.
  await notifications.sendAdminEmail(
    `[Reservas] Cancelada ${reserva.codigo}`,
    `<p>Reserva <strong>${reserva.codigo}</strong> cancelada (${actor}).</p>
     <p>Comercio: ${comercio.nombre_publico || comercio.nombre} · Cliente: ${reserva.cliente_nombre || '—'}</p>
     <p>MP payment: ${paymentId || '—'} · refund: ${mpRefundId || '—'} · monto reembolso calc: $${refundAmount}</p>
     <p>${reembolsoNota || ''}</p>`
  );

  return {
    success: true,
    reserva: updated,
    refundAmount,
    mpRefundId,
    dentroVentana,
  };
}
