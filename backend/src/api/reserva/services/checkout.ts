import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';
import { createReservaRepository } from '../repositories/reserva-repository';
import { expireStaleHolds } from '../../reserva-comercio/services/disponibilidad';
import { confirmReservaFromPayment } from '../../../services/reservation-payment-success-handler';

const inFlightMpPaymentIds = new Set<string>();

export type CheckoutInput = {
  slug: string;
  recursoDocumentId: string;
  inicio: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
};

function generateCodigo(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'JD-';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function resolveMpToken(envName?: string | null): string | null {
  if (!envName) return process.env.MP_ACCESS_TOKEN || null;
  return process.env[envName] || process.env.MP_ACCESS_TOKEN || null;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

export async function createCheckout(strapi: any, input: CheckoutInput) {
  await expireStaleHolds(strapi);

  const slug = input.slug?.trim();
  if (!slug) throw new ValidationError('slug es requerido');
  if (!input.recursoDocumentId) throw new ValidationError('recursoDocumentId es requerido');
  if (!input.inicio) throw new ValidationError('inicio es requerido');
  if (!input.cliente_nombre?.trim()) throw new ValidationError('cliente_nombre es requerido');
  if (!input.cliente_email?.trim()) throw new ValidationError('cliente_email es requerido');

  const inicio = new Date(input.inicio);
  if (Number.isNaN(inicio.getTime())) {
    throw new ValidationError('inicio inválido');
  }

  const comercioRepo = createReservaComercioRepository(strapi);
  const comercio = await comercioRepo.findBySlug(slug, {
    recursos: { sort: ['orden:asc'] },
  });
  if (!comercio || comercio.activo === false) {
    throw new NotFoundError('Comercio de reservas');
  }

  const recurso = (comercio.recursos || []).find(
    (r: any) => r.documentId === input.recursoDocumentId && r.activo !== false
  );
  if (!recurso) {
    throw new ValidationError('Recurso no válido para este comercio');
  }

  const duracion = Number(comercio.duracion_minutos) || 60;
  const bufferMin = Number(comercio.buffer_limpieza_minutos) || 0;
  const fin = new Date(inicio.getTime() + duracion * 60_000);
  const holdTtl = Number(comercio.hold_ttl_minutos) || 15;
  const monto = Number(comercio.precio_ars);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ValidationError('precio_ars del comercio inválido');
  }

  const reservaRepo = createReservaRepository(strapi);
  const ocupaciones = await reservaRepo.findOccupyingInRange({
    comercioDocumentId: comercio.documentId,
    recursoDocumentId: recurso.documentId,
    rangeStart: inicio.toISOString(),
    rangeEnd: new Date(fin.getTime() + bufferMin * 60_000).toISOString(),
  });

  const now = Date.now();
  const conflict = ocupaciones.some((r: any) => {
    if (r.estado === 'confirmada') {
      return overlaps(
        inicio.getTime(),
        fin.getTime(),
        new Date(r.inicio).getTime(),
        new Date(r.fin).getTime() + bufferMin * 60_000
      );
    }
    if (r.estado === 'hold') {
      if (r.hold_expires_at && new Date(r.hold_expires_at).getTime() <= now) return false;
      return overlaps(
        inicio.getTime(),
        fin.getTime(),
        new Date(r.inicio).getTime(),
        new Date(r.fin).getTime() + bufferMin * 60_000
      );
    }
    return false;
  });

  if (conflict) {
    throw new ValidationError('Ese hueco ya no está disponible');
  }

  const codigo = generateCodigo();
  const holdExpires = new Date(Date.now() + holdTtl * 60_000);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:1337';

  const hold = await reservaRepo.create({
    codigo,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: 'hold',
    origen: 'online',
    cliente_nombre: input.cliente_nombre.trim(),
    cliente_email: input.cliente_email.trim().toLowerCase(),
    cliente_telefono: input.cliente_telefono?.trim() || null,
    hold_expires_at: holdExpires.toISOString(),
    monto_ars: monto,
    excepcion_sin_pago: false,
    comercio: comercio.documentId,
    recurso: recurso.documentId,
  });

  const successUrl = `${frontendUrl}/reservas/${comercio.slug}/exito?codigo=${encodeURIComponent(codigo)}`;
  const failureUrl = `${frontendUrl}/reservas/${comercio.slug}/fallo?codigo=${encodeURIComponent(codigo)}`;
  const pendingUrl = `${frontendUrl}/reservas/${comercio.slug}/pending?codigo=${encodeURIComponent(codigo)}`;

  if (comercio.modo_simulacion) {
    await confirmReservaFromPayment(strapi, hold.documentId, `SIMULATED_${Date.now()}`);
    strapi.log.info(`[ReservaCheckout] Simulación OK ${codigo}`);
    return {
      simulated: true,
      codigo,
      reservaDocumentId: hold.documentId,
      init_point: successUrl,
    };
  }

  const accessToken = resolveMpToken(comercio.mp_token_env);
  if (!accessToken) {
    throw new ValidationError(
      `Token MP no configurado (${comercio.mp_token_env || 'MP_ACCESS_TOKEN'})`
    );
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: hold.documentId,
          title: `Reserva ${comercio.nombre_publico || comercio.nombre} — ${recurso.nombre}`,
          quantity: 1,
          unit_price: monto,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: input.cliente_nombre.trim(),
        email: input.cliente_email.trim().toLowerCase(),
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/reservas/webhook`,
      external_reference: hold.documentId,
      metadata: {
        tipo: 'reserva',
        comercio_slug: comercio.slug,
        reserva_codigo: codigo,
      },
    },
  });

  await reservaRepo.update(hold.documentId, {
    mp_preference_id: result.id,
  });

  return {
    simulated: false,
    codigo,
    reservaDocumentId: hold.documentId,
    preferenceId: result.id,
    init_point: result.init_point || result.sandbox_init_point,
  };
}

export async function simulateReservaSuccess(strapi: any, reservaDocumentId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new ValidationError('Simulación deshabilitada en producción');
  }
  return confirmReservaFromPayment(
    strapi,
    reservaDocumentId,
    `SIMULATED_${Date.now()}`
  );
}

export async function processReservaPaymentNotification(strapi: any, paymentId: string) {
  const paymentIdStr = String(paymentId);
  const repo = createReservaRepository(strapi);

  const existing = await repo.findByMpPaymentId(paymentIdStr);
  if (existing?.estado === 'confirmada') {
    return { duplicate: true };
  }

  if (inFlightMpPaymentIds.has(paymentIdStr)) {
    return { duplicate: true, inFlight: true };
  }
  inFlightMpPaymentIds.add(paymentIdStr);

  try {
    // Necesitamos un token para consultar el pago. Probamos env del comercio vía metadata
    // tras un get con token plataforma/jaditek.
    const tokenCandidates = [
      process.env.MP_ACCESS_TOKEN_JADITEK,
      process.env.MP_ACCESS_TOKEN,
    ].filter(Boolean) as string[];

    if (!tokenCandidates.length) {
      throw new ValidationError('No hay token MP para procesar webhook de reserva');
    }

    let data: any = null;
    let lastErr: Error | null = null;
    for (const token of tokenCandidates) {
      try {
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);
        data = await payment.get({ id: paymentIdStr });
        break;
      } catch (err: any) {
        lastErr = err;
      }
    }
    if (!data) {
      throw lastErr || new Error('No se pudo obtener el pago MP');
    }

    if (data.status !== 'approved') {
      strapi.log.info(`[ReservaWebhook] Pago ${paymentIdStr} estado=${data.status}`);
      return { processed: true, status: data.status };
    }

    const externalReference = data.external_reference;
    if (!externalReference) {
      throw new ValidationError('Pago sin external_reference');
    }

    // Si el comercio tiene token propio distinto, re-consultar no es necesario:
    // ya tenemos approved + external_reference.
    return confirmReservaFromPayment(strapi, String(externalReference), paymentIdStr);
  } finally {
    inFlightMpPaymentIds.delete(paymentIdStr);
  }
}
