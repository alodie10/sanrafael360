/**
 * Escapa un valor para CSV: envuelve en comillas dobles si contiene coma,
 * comilla doble o salto de línea.
 */
export function escapeCSV(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const csvLines = [headers.join(','), ...rows.map((row) => row.map(escapeCSV).join(','))];
  return csvLines.join('\n');
}
