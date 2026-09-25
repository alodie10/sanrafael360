import { Negocio } from "@/types/strapi";

export interface FichaFaq {
  q: string;
  a: string;
}

export interface FichaAnswers {
  summary: string;
  faqs: FichaFaq[];
}

const DAY_ORDER = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function plain(value?: string | null): string {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clock(time?: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  if (!hours || minutes == null || minutes === "") return null;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function looksLikeHours(text: string): boolean {
  return (
    /\b\d{1,2}:\d{2}\b/.test(text) ||
    /lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo/i.test(text)
  );
}

/** Horario solo si el CMS publicó una franja. `horarios_texto` a veces trae otra nota. */
export function publishedHours(negocio: Negocio): string | null {
  const freeText = plain(negocio.horarios_texto) || plain(negocio.horarios);
  if (freeText && looksLikeHours(freeText)) return freeText;

  const byDay = new Map<string, string[]>();
  for (const slot of negocio.schedules || []) {
    if (slot.is_closed) continue;
    const opens = clock(slot.opening_time);
    const closes = clock(slot.closing_time);
    if (!slot.day || !opens || !closes) continue;
    const list = byDay.get(slot.day) || [];
    list.push(`${opens} a ${closes}`);
    byDay.set(slot.day, list);
  }

  const parts = DAY_ORDER.filter((day) => byDay.has(day)).map(
    (day) => `${day} ${byDay.get(day)!.join(" y ")}`
  );
  return parts.length > 0 ? parts.join("; ") : null;
}

function whereLine(negocio: Negocio): string {
  const address = plain(negocio.direccion);
  if (!address) return "Está en San Rafael, Mendoza.";
  const alreadyLocal = /san rafael/i.test(address);
  return alreadyLocal
    ? `Está en ${address}.`
    : `Está en ${address}, San Rafael, Mendoza.`;
}

function contactBits(negocio: Negocio): string[] {
  const bits: string[] = [];
  const phone = plain(negocio.telefono);
  const whatsapp = plain(negocio.whatsapp);
  if (phone) bits.push(`teléfono ${phone}`);
  if (whatsapp && whatsapp !== phone) bits.push(`WhatsApp ${whatsapp}`);
  const email = plain(negocio.email);
  if (email) bits.push(`correo ${email}`);
  const website = plain(negocio.website);
  if (/^https?:\/\//i.test(website)) bits.push(`sitio ${website}`);
  const instagram = instagramUrl(negocio.instagram);
  if (instagram) bits.push(`Instagram ${instagram}`);
  return bits;
}

function instagramUrl(value?: string | null): string | null {
  const raw = plain(value);
  if (!raw) return null;
  if (/^https?:\/\/(www\.)?instagram\.com\//i.test(raw)) return raw.replace(/\/$/, "");
  const handle = raw.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return `https://instagram.com/${handle}`;
}

function pushCapped(faqs: FichaFaq[], item: FichaFaq) {
  if (faqs.length < 3) faqs.push(item);
}

export function buildFichaAnswers(negocio: Negocio): FichaAnswers {
  const name = plain(negocio.nombre) || "Este negocio";
  const category = plain(negocio.categoria?.nombre);
  const hours = publishedHours(negocio);
  const bits = contactBits(negocio);
  const place = whereLine(negocio);

  const intro = category
    ? `${name} figura en San Rafael 360 como ${category}.`
    : `${name} figura en el directorio San Rafael 360.`;
  const hoursSentence = hours ? `Horario publicado: ${hours}.` : "";
  const contactSentence =
    bits.length > 0 ? `Se contacta por ${bits.join(", ")}.` : "";

  const summary = [intro, place, hoursSentence, contactSentence]
    .filter(Boolean)
    .join(" ");

  const faqs: FichaFaq[] = [
    { q: `¿Dónde queda ${name}?`, a: `${name} ${place.charAt(0).toLowerCase()}${place.slice(1)}` },
  ];

  if (hours) {
    pushCapped(faqs, {
      q: `¿Cuál es el horario de ${name}?`,
      a: `El horario publicado de ${name} es: ${hours}.`,
    });
  } else if (category) {
    pushCapped(faqs, {
      q: `¿Qué es ${name}?`,
      a: `${name} es ${category} en San Rafael, Mendoza, publicado en San Rafael 360.`,
    });
  }

  if (bits.length > 0) {
    pushCapped(faqs, {
      q: `¿Cómo contacto a ${name}?`,
      a: `${name} se contacta por ${bits.join(", ")}.`,
    });
  }

  if (negocio.reserva_comercio?.slug) {
    pushCapped(faqs, {
      q: `¿Se puede reservar en ${name}?`,
      a: `Sí. ${name} toma reservas desde su ficha en San Rafael 360.`,
    });
  }

  return { summary, faqs };
}
