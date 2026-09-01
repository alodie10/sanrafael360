export type ProspeccionNegocio = {
  documentId: string;
  nombre: string;
  slug: string;
  whatsapp: string | null;
  telefono: string | null;
  categoriaNombre: string | null;
};

export type ProspeccionPlantilla = {
  texto_ficha: string;
  mensaje: string;
  firma: string;
};

export type ProspeccionAlcanzado = {
  documentId: string;
  ultimo_tipo: "saludo" | "ficha_mensaje";
  ultimo_envio_at: string;
  negocio: ProspeccionNegocio | null;
};

const TZ = "America/Argentina/Mendoza";

export function greetingForHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 12) return "¡Buen día!";
  if (h >= 12 && h < 20) return "¡Buenas tardes!";
  return "¡Buenas noches!";
}

export function hourInMendoza(now: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  const hour = parseInt(hourStr, 10);
  return hour === 24 ? 0 : hour;
}

export function greetingNow(now: Date = new Date()): string {
  return greetingForHour(hourInMendoza(now));
}

export function composeFichaMensaje(input: {
  url: string;
  texto_ficha: string;
  mensaje: string;
  firma: string;
}): string {
  return [input.url, input.texto_ficha, input.mensaje, input.firma]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function phoneForWhatsapp(negocio: ProspeccionNegocio | null): string {
  return String(negocio?.whatsapp || negocio?.telefono || "").trim();
}
