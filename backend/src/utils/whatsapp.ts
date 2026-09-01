/** Dígitos locales AR para el campo WhatsApp (sin 54/549 ni ceros a la izquierda). */
export function normalizeLocalPhoneDigits(raw?: string | null): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);
  while (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.startsWith('549') && digits.length >= 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54') && digits.length >= 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('9') && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits.length >= 8 ? digits : null;
}

/** Normaliza un teléfono AR al formato wa.me (549…). */
export function normalizeWhatsappDigits(raw?: string | null): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);
  while (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.startsWith('549') && digits.length >= 12) return digits;

  if (digits.length === 10 && digits.startsWith('15')) {
    digits = `549${digits.slice(2)}`;
  } else if (digits.length === 10) {
    digits = `549${digits}`;
  } else if (digits.length === 11 && digits.startsWith('9')) {
    digits = `54${digits}`;
  } else if (digits.length === 12 && digits.startsWith('54') && !digits.startsWith('549')) {
    digits = `549${digits.slice(2)}`;
  }

  return digits.length >= 10 ? digits : null;
}

export function buildWhatsappUrl(rawNumber: string, text: string): string | null {
  const digits = normalizeWhatsappDigits(rawNumber);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
