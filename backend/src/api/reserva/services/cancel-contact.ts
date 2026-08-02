import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createReservaRepository } from '../repositories/reserva-repository';
import { verifyReservaCancelToken } from './cancel-token';

function digitsOnly(value?: string | null): string {
  return String(value || '').replace(/\D/g, '');
}

/** Normaliza a formato wa.me (AR: 549…). */
export function normalizeWhatsappDigits(raw?: string | null): string | null {
  let digits = digitsOnly(raw);
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('15')) {
    digits = `549${digits.slice(2)}`;
  } else if (digits.length === 10) {
    digits = `549${digits}`;
  } else if (digits.length === 11 && digits.startsWith('9')) {
    digits = `54${digits}`;
  } else if (digits.length === 12 && digits.startsWith('54') && !digits.startsWith('549')) {
    // 54 + area + number without 9
    digits = `549${digits.slice(2)}`;
  }
  return digits.length >= 10 ? digits : null;
}

function formatCuando(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timeZone || 'America/Argentina/Mendoza',
  }).format(new Date(iso));
}

/**
 * Info pública para el link de “solicitar cancelación”:
 * no cancela; solo arma contacto WhatsApp del negocio vinculado.
 */
export async function getReservaCancelContact(
  strapi: any,
  params: { token: string; slug: string }
) {
  const documentId = verifyReservaCancelToken(params.token);
  if (!documentId) {
    throw new ValidationError('Link inválido o vencido');
  }

  const repo = createReservaRepository(strapi);
  const reserva = await repo.findByDocumentId(documentId, {
    comercio: { populate: ['negocio'] },
    recurso: true,
  });

  if (!reserva) throw new NotFoundError('Reserva');
  if (reserva.comercio?.slug !== params.slug) {
    throw new NotFoundError('Reserva');
  }

  if (reserva.estado === 'cancelada') {
    return {
      estado: 'cancelada' as const,
      codigo: reserva.codigo,
      comercioNombre: reserva.comercio?.nombre_publico || reserva.comercio?.nombre,
      whatsapp: null,
      whatsappUrl: null,
      mensaje: 'Esta reserva ya está cancelada.',
    };
  }

  if (reserva.estado !== 'confirmada' && reserva.estado !== 'hold') {
    throw new ValidationError(`No se puede gestionar una reserva en estado ${reserva.estado}`);
  }

  const comercio = reserva.comercio;
  const negocio = comercio?.negocio;
  const whatsapp = normalizeWhatsappDigits(negocio?.whatsapp || negocio?.telefono);
  const comercioNombre = comercio?.nombre_publico || comercio?.nombre || 'el local';
  const cuando = formatCuando(reserva.inicio, comercio?.timezone);
  const recursoNombre = reserva.recurso?.nombre || 'turno';

  const text = [
    `Hola, quiero cancelar mi reserva ${reserva.codigo} en ${comercioNombre}.`,
    `Turno: ${cuando} · ${recursoNombre}.`,
    `Nombre: ${reserva.cliente_nombre || '—'}.`,
  ].join(' ');

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
    : null;

  return {
    estado: reserva.estado as string,
    codigo: reserva.codigo,
    comercioNombre,
    recursoNombre,
    cuando,
    clienteNombre: reserva.cliente_nombre,
    whatsapp,
    whatsappUrl,
    mensaje: whatsappUrl
      ? 'Escribinos por WhatsApp para solicitar la cancelación. El local confirma y gestiona el reembolso si corresponde.'
      : 'Este local aún no tiene WhatsApp cargado. Contactalo por los medios publicados en su ficha.',
  };
}
