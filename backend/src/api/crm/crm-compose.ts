export function composeCrmMensaje(input: {
  saludo: string;
  nombre: string;
  mensaje: string;
  firma: string;
  piezaUrl?: string;
}): string {
  const hola = input.nombre.trim() ? `Hola ${input.nombre.trim()},` : 'Hola,';
  const parts = [input.saludo, hola, input.mensaje, input.firma]
    .map((part) => String(part || '').trim())
    .filter(Boolean);
  const link = String(input.piezaUrl || '').trim();
  if (link) parts.push(link);
  return parts.join('\n\n');
}
