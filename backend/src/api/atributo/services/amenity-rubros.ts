import type { AmenityRubro } from './amenity-catalog';

const ALOJAMIENTO = [
  'categoria',
  'alojamientos',
  'apart-hoteles',
  'cabanas',
  'hostels',
  'hoteles',
  'posadas',
  'posada',
];

const GASTRONOMIA = [
  'bar',
  'bodegas',
  'cafe',
  'casa-de-te',
  'cerveceria',
  'comida-para-llevar',
  'comida-rapida',
  'delicatessen',
  'gastronomia',
  'hamburgueseria',
  'heladeria',
  'marisqueria',
  'panaderia',
  'pasteleria',
  'pizzeria',
  'restaurante',
  'sushi',
];

const COMERCIOS = [
  'aceite-de-oliva',
  'agencia_autos',
  'agencias-de-viaje',
  'alfajores',
  'alineacion-y-balanceo',
  'auxilio-mecanico',
  'belleza-estetica',
  'bodegas',
  'cambio-de-aceite',
  'cosmetica',
  'cotillon',
  'decoracion',
  'escapes',
  'ferreterias',
  'frenos',
  'hogar_deco',
  'indumentaria',
  'inmobiliarias',
  'inyectores',
  'lavadero_autos',
  'licores-y-conservas-gourmet-y-artesanales',
  'mascotas_veterinarias',
  'materiales_de_construccion',
  'muebles',
  'productos-organicos',
  'productos_regionales',
  'repuestos_automotor',
  'salud_bienestar',
  'servicios-industriales-b2b',
  'servicios_para_el_hogar',
  'servicios_profesionales',
  'talleres_gomerias',
  'unas',
];

function index(slugs: string[], rubro: AmenityRubro): Array<[string, AmenityRubro]> {
  return slugs.map((slug) => [slug, rubro]);
}

const PAIRS = [
  ...index(ALOJAMIENTO, 'alojamiento'),
  ...index(GASTRONOMIA, 'gastronomia'),
  ...index(COMERCIOS, 'comercios'),
];

export function rubrosFromSlugs(slugs: Array<string | null | undefined>): AmenityRubro[] {
  const found = new Set<AmenityRubro>();
  for (const slug of slugs) {
    if (!slug) continue;
    const key = slug.trim().toLowerCase();
    for (const [candidate, rubro] of PAIRS) {
      if (candidate === key) found.add(rubro);
    }
  }
  return ['alojamiento', 'gastronomia', 'comercios'].filter((rubro) => found.has(rubro));
}
