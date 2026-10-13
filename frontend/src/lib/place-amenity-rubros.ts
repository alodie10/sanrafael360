import catalog from "../../../backend/src/api/atributo/services/amenity-catalog.json";

export type AmenityRubro = "alojamiento" | "gastronomia" | "comercios";

const RUBRO_ORDER: AmenityRubro[] = ["alojamiento", "gastronomia", "comercios"];

const RUBRO_LABEL: Record<AmenityRubro, string> = {
  alojamiento: "alojamiento",
  gastronomia: "gastronomía",
  comercios: "comercios y servicios",
};

const ALOJAMIENTO = [
  "categoria",
  "alojamientos",
  "apart-hoteles",
  "cabanas",
  "hostels",
  "hoteles",
  "posadas",
  "posada",
];

const GASTRONOMIA = [
  "bar",
  "bodegas",
  "cafe",
  "casa-de-te",
  "cerveceria",
  "comida-para-llevar",
  "comida-rapida",
  "delicatessen",
  "gastronomia",
  "hamburgueseria",
  "heladeria",
  "marisqueria",
  "panaderia",
  "pasteleria",
  "pizzeria",
  "restaurante",
  "sushi",
];

const COMERCIOS = [
  "aceite-de-oliva",
  "agencia_autos",
  "agencias-de-viaje",
  "alfajores",
  "alineacion-y-balanceo",
  "auxilio-mecanico",
  "belleza-estetica",
  "bodegas",
  "cambio-de-aceite",
  "cosmetica",
  "cotillon",
  "decoracion",
  "escapes",
  "ferreterias",
  "frenos",
  "hogar_deco",
  "indumentaria",
  "inmobiliarias",
  "inyectores",
  "lavadero_autos",
  "licores-y-conservas-gourmet-y-artesanales",
  "mascotas_veterinarias",
  "materiales_de_construccion",
  "muebles",
  "productos-organicos",
  "productos_regionales",
  "repuestos_automotor",
  "salud_bienestar",
  "servicios-industriales-b2b",
  "servicios_para_el_hogar",
  "servicios_profesionales",
  "talleres_gomerias",
  "unas",
];

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const BY_SLUG = new Map<string, AmenityRubro>();
for (const slug of ALOJAMIENTO) BY_SLUG.set(slug, "alojamiento");
for (const slug of GASTRONOMIA) {
  if (!BY_SLUG.has(slug)) BY_SLUG.set(slug, "gastronomia");
}
for (const slug of COMERCIOS) {
  const current = BY_SLUG.get(slug);
  if (!current) BY_SLUG.set(slug, "comercios");
}

const BY_NAME = new Map(
  (catalog as Array<{ nombre: string; rubros: AmenityRubro[] }>).map((item) => [
    fold(item.nombre),
    item.rubros,
  ])
);

export function rubrosFromSlugs(slugs: Array<string | null | undefined>): AmenityRubro[] {
  const found = new Set<AmenityRubro>();
  for (const slug of slugs) {
    if (!slug) continue;
    const rubro = BY_SLUG.get(fold(slug));
    if (rubro) found.add(rubro);
    if (slug === "bodegas" || fold(slug) === "bodegas") {
      found.add("gastronomia");
      found.add("comercios");
    }
  }
  return RUBRO_ORDER.filter((rubro) => found.has(rubro));
}

export function rubroLabel(rubros: AmenityRubro[]): string {
  return rubros.map((rubro) => RUBRO_LABEL[rubro]).join(" y ");
}

export function visibleAmenities<T extends { nombre?: string; tipo?: string; documentId?: string }>(
  atributos: T[],
  categoriaSlug: string | null | undefined,
  selectedIds: string[]
): T[] {
  const rubros = rubrosFromSlugs([categoriaSlug]);
  const selected = new Set(selectedIds);
  return atributos
    .filter((item) => {
      if (item.tipo && item.tipo !== "facilidad") return false;
      const own = BY_NAME.get(fold(item.nombre || ""));
      if (!own) return false;
      const inRubro = rubros.some((rubro) => own.includes(rubro));
      const alreadyOn = Boolean(item.documentId && selected.has(item.documentId));
      return inRubro || alreadyOn;
    })
    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
}
