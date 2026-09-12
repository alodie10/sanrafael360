import type { IntentEntry, IntentMap } from "./expand-intent";
import { lexicalVariants, normalizeGuideText } from "./text";

/** Catálogo vivo de Strapi (prod, sep 2026). Fallback si el runtime no manda categorías. */
export const FALLBACK_CATEGORIES = [
  "Gastronomía",
  "Bodegas",
  "Alojamientos",
  "Apart Hoteles",
  "Hostels",
  "Hoteles",
  "Posadas",
  "Cabañas",
  "Cabalgata",
  "Turismo Aventura",
  "Rafting",
  "Trekking",
  "Aceite de Oliva",
  "Alfajores",
  "Hamburguesería",
  "Inmobiliarias",
  "Cerveceria",
  "Pizzeria",
  "Restaurante",
  "Bar",
  "Panaderia",
  "Comida para llevar",
  "Sushi",
  "Café",
  "Entretenimientos",
  "Ferreterías",
  "Lavadero de Autos",
  "Productos Regionales",
  "Salud y Bienestar",
  "Servicios Profesionales",
  "Mascotas y Veterinarias",
  "Repuestos Automotrices",
  "Alquiler - Venta de Autos",
  "Indumentaria",
  "Belleza & Estética",
  "Hogar y Decoración",
  "Pesca y Camping",
  "Agencia de Viajes",
  "Servicios para el Hogar y Tecno",
  "Interés Turístico",
  "Vinos & Delicatessen",
  "Materiales de construcción",
  "Heladería",
  "Talleres Mecánicos - Gomerías",
];

/** Cómo dice la gente cada rubro. No incluye hotel/vino/etc.: eso lo tapa el seed. */
const FLOOR_TERMS: Record<string, string[]> = {
  alojamientos: ["alojamiento", "hospedaje"],
  cabalgata: ["cabalgata", "caballo", "caballos"],
  turismo_aventura: ["aventura", "aire libre"],
  rafting: ["rafting", "kayak"],
  trekking: ["trekking", "caminata", "montana"],
  aceite_de_oliva: ["aceite de oliva", "oliva", "olivo"],
  alfajores: ["alfajor", "alfajores", "dulce de leche"],
  inmobiliarias: ["inmobiliaria", "alquiler", "tasacion", "lote"],
  bar: ["bar", "trago", "tragos", "after"],
  panaderia: ["panaderia", "facturas", "medialunas"],
  comida_para_llevar: ["comida para llevar", "vianda", "viandas", "delivery"],
  sushi: ["sushi", "sashimi", "nigiri"],
  cafe: ["cafe", "cafeteria", "cappuccino", "brunch"],
  entretenimientos: ["entretenimiento", "cine", "boliche", "karaoke", "bowling"],
  ferreterias: ["ferreteria", "ferreterias", "herramientas", "tornillo", "pintura"],
  lavadero_de_autos: ["lavadero", "lavado de auto", "detailing"],
  productos_regionales: ["regionales", "souvenir", "artesania"],
  servicios_profesionales: ["abogado", "contador", "escribania", "arquitecto"],
  repuestos_automotrices: ["repuestos", "pastillas de freno", "amortiguador", "bateria"],
  alquiler_venta_de_autos: ["alquiler de auto", "rent a car", "usados"],
  indumentaria: ["ropa", "zapatillas", "calzado", "jean", "campera"],
  hogar_y_decoracion: ["muebles", "deco", "sillon", "lampara"],
  pesca_y_camping: ["pesca", "camping", "anzuelo", "carpa"],
  agencia_de_viajes: ["agencia de viajes", "pasaje", "paquete", "vuelo"],
  servicios_para_el_hogar_y_tecno: ["plomero", "gasista", "electricista", "tecnico"],
  vinos_delicatessen: ["fiambre", "queso", "picada", "delicatessen"],
  materiales_de_construccion: ["cemento", "ladrillo", "porcelanato", "arena"],
};

export function floorKey(nombre: string): string {
  return normalizeGuideText(nombre)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const n = normalizeGuideText(value);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function reservedNeedles(overlay: IntentMap): Set<string> {
  const out = new Set<string>();
  for (const [key, entry] of Object.entries(overlay)) {
    for (const item of [key, ...(entry.aliases || []), ...entry.queries]) {
      for (const needle of lexicalVariants(item)) out.add(needle);
    }
  }
  return out;
}

function overlayOwnsCategory(nombre: string, overlay: IntentMap): boolean {
  const n = normalizeGuideText(nombre);
  return Object.values(overlay).some((entry) =>
    entry.categories.some((category) => normalizeGuideText(category) === n)
  );
}

function floorAliases(nombre: string, reserved: Set<string>): string[] {
  const extras = FLOOR_TERMS[floorKey(nombre)] || [];
  return uniqueTerms([nombre, ...extras]).filter((term) => !reserved.has(term) && term.length >= 3);
}

function floorQueries(nombre: string, aliases: string[]): string[] {
  const extras = (FLOOR_TERMS[floorKey(nombre)] || []).map((term) => normalizeGuideText(term));
  return uniqueTerms([...extras, ...aliases]).filter((term) => aliases.includes(term)).slice(0, 4);
}

export function buildCategoryFloor(categories: string[], overlay: IntentMap): IntentMap {
  const reserved = reservedNeedles(overlay);
  const names = categories.length ? categories : FALLBACK_CATEGORIES;
  const floor: IntentMap = {};
  for (const nombre of names) {
    if (!nombre || overlayOwnsCategory(nombre, overlay)) continue;
    const key = floorKey(nombre);
    if (!key || overlay[key] || floor[key]) continue;
    const aliases = floorAliases(nombre, reserved);
    if (!aliases.length) continue;
    const entry: IntentEntry = {
      aliases,
      queries: floorQueries(nombre, aliases),
      categories: [nombre],
      match: "default",
    };
    floor[key] = entry;
  }
  return floor;
}
