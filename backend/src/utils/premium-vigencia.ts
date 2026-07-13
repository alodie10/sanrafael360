/** Calcula is_premium y la fecha ISO normalizada para updateVigencia del portal admin. */
export function resolveVigenciaUpdate(premium_valid_until: string | null): {
  is_premium: boolean;
  validUntilISO: string | null;
} {
  const is_premium = premium_valid_until
    ? new Date(premium_valid_until) >= new Date(new Date().setHours(0, 0, 0, 0))
    : false;

  let validUntilISO: string | null = null;
  if (premium_valid_until) {
    const d = new Date(premium_valid_until);
    d.setHours(12, 0, 0, 0);
    validUntilISO = d.toISOString();
  }

  return { is_premium, validUntilISO };
}
