export const PLANTILLA_SLOT_COUNT = 5;

export type PlantillaSlot = {
  titulo: string;
  texto: string;
};

export const DEFAULT_SLOT_TITULOS = [
  "Institucional",
  "Prospectar",
  "Seguimiento",
  "Oferta",
  "Cierre",
] as const;

export function parsePlantillaIndex(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= PLANTILLA_SLOT_COUNT) return 0;
  return n;
}

export function normalizePlantillaSlots(raw: unknown, fallbackMensaje = ""): PlantillaSlot[] {
  const rows = Array.isArray(raw) ? raw : [];
  const fallback = String(fallbackMensaje || "").trim();
  return DEFAULT_SLOT_TITULOS.map((defaultTitulo, i) => {
    const row = rows[i] && typeof rows[i] === "object" ? (rows[i] as Record<string, unknown>) : {};
    const titulo = String(row.titulo || defaultTitulo).trim() || defaultTitulo;
    const texto = String(row.texto ?? "").trim() || (i === 0 ? fallback : "");
    return { titulo, texto };
  });
}
