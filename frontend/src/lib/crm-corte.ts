/**
 * CRM-DEC-005 / CRM-DEC-008 — corte del nav de captación.
 * false: Diego sigue usando Places / Prospección / Crear negocio / Interesados.
 * No poner true hasta que el CRM cubra esos flujos (Places → ficha, etc.).
 */
export const CRM_CORTE_NAV = false;

export const CRM_LEGACY_CAPTATION_TABS = [
  "leads",
  "alta-negocio",
  "discovery",
  "prospeccion",
] as const;
