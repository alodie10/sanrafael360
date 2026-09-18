export function composeCrmMensaje(input: {
  saludo: string;
  nombre: string;
  mensaje: string;
  firma: string;
}): string {
  const hola = input.nombre.trim() ? `Hola ${input.nombre.trim()},` : 'Hola,';
  return [input.saludo, hola, input.mensaje, input.firma]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join('\n\n');
}
