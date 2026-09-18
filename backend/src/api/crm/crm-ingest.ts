export type CrmIngestItem = {
  nombre: string;
  telefono: string;
  instagram: string;
  nota: string;
};

function extractJsonArray(raw: string): unknown {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Pegá el JSON de la IA');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No encontré un array JSON. Copiá el prompt del CRM y pedile a la IA ese formato.');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function asItem(row: unknown): CrmIngestItem | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const nombre = String(r.nombre || '').trim();
  if (!nombre) return null;
  return {
    nombre,
    telefono: String(r.telefono || '').trim(),
    instagram: String(r.instagram || '').trim(),
    nota: String(r.nota || '').trim(),
  };
}

export function parseCrmIngestPayload(raw: string): CrmIngestItem[] {
  let parsed: unknown;
  try {
    parsed = extractJsonArray(raw);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('El JSON está mal formado');
    }
    throw err;
  }
  if (!Array.isArray(parsed)) {
    throw new Error('El JSON debe ser un array');
  }
  const items = parsed.map(asItem).filter((row): row is CrmIngestItem => Boolean(row));
  if (!items.length) {
    throw new Error('Ningún ítem tiene nombre');
  }
  return items.slice(0, 15);
}

export function normalizeNombreKey(nombre: string): string {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
