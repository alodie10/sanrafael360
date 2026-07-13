import { isSemestralPlan, resolvePremiumDays } from '../utils/pago-plan';

export interface PaymentSuccessRepos {
  pagoRepo: {
    findByMpPaymentId: (
      id: string
    ) => Promise<Array<{ estado?: string; documentId: string; monto?: number }>>;
    findSubscriptionConfig: () => Promise<{
      precio_semestral?: number;
      dias_semestral?: number;
      dias_mensual?: number;
    } | null>;
    findPendingByExternalReference: (
      ref: string
    ) => Promise<{ documentId: string; monto?: number } | null>;
    update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
    create: (data: Record<string, unknown>) => Promise<unknown>;
  };
  negocioRepo: {
    findById: (id: string) => Promise<{ id: number; nombre: string } | null>;
    update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  };
}

export interface PaymentSuccessLogger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

/** Procesa un pago aprobado y activa premium (idempotente por mp_payment_id). */
export async function processPaymentSuccess(
  repos: PaymentSuccessRepos,
  log: PaymentSuccessLogger,
  externalReference: string,
  paymentId: string,
  mpPayload?: unknown
) {
  const { pagoRepo, negocioRepo } = repos;
  const paymentIdStr = String(paymentId);

  const existingRows = await pagoRepo.findByMpPaymentId(paymentIdStr);
  const existing = existingRows[0];

  if (existing?.estado === 'aprobado') {
    log.info(`[PagoSuccess] Pago ${paymentIdStr} ya estaba aprobado — skip`);
    return { success: true, duplicate: true };
  }

  log.info(`[PagoSuccess] Activando premium para negocio: ${externalReference}`);

  const negocio = await negocioRepo.findById(externalReference);
  if (!negocio) {
    log.error(`[PagoSuccess] Negocio ${externalReference} no encontrado`);
    return;
  }

  const config = await pagoRepo.findSubscriptionConfig();
  const pagoForPlan =
    existing ?? (await pagoRepo.findPendingByExternalReference(externalReference));

  const isSemestral = isSemestralPlan(
    pagoForPlan?.monto,
    config?.precio_semestral || 50000
  );
  const diasSumar = resolvePremiumDays(
    isSemestral,
    config?.dias_semestral || 180,
    config?.dias_mensual || 30
  );

  const now = new Date();
  const validUntil = new Date();
  validUntil.setDate(now.getDate() + diasSumar);

  await negocioRepo.update(externalReference, {
    is_premium: true,
    premium_since: now,
    premium_valid_until: validUntil,
    publishedAt: now,
  });

  const mpDetails = mpPayload != null ? JSON.parse(JSON.stringify(mpPayload)) : undefined;
  const approvedData = {
    estado: 'aprobado' as const,
    mp_payment_id: paymentIdStr,
    fecha_pago: now,
    external_reference: externalReference,
    negocio: negocio.id,
    publishedAt: now,
    ...(mpDetails ? { detalles_mp: mpDetails } : {}),
  };

  if (existing) {
    await pagoRepo.update(existing.documentId, approvedData);
  } else {
    const pagoPendiente = await pagoRepo.findPendingByExternalReference(externalReference);

    if (pagoPendiente) {
      await pagoRepo.update(pagoPendiente.documentId, approvedData);
    } else {
      await pagoRepo.create({
        monto: 0,
        ...approvedData,
      });
    }
  }

  log.info(
    `[PagoSuccess] Negocio ${negocio.nombre} ahora es PREMIUM hasta ${validUntil.toLocaleDateString()}`
  );
  return { success: true, negocio: negocio.nombre };
}
