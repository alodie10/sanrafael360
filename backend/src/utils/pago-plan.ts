/** Determina si un monto corresponde al plan semestral según el umbral configurado. */
export function isSemestralPlan(
  monto: number | null | undefined,
  precioSemestral: number
): boolean {
  return monto != null && monto >= precioSemestral;
}

/** Días de premium a sumar según el tipo de plan. */
export function resolvePremiumDays(
  isSemestral: boolean,
  diasSemestral: number,
  diasMensual: number
): number {
  return isSemestral ? diasSemestral : diasMensual;
}
