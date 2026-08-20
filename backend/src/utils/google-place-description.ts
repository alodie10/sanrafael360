const GENERIC_PLACE_TYPES = new Set([
  'establishment',
  'point_of_interest',
  'premise',
  'geocode',
  'political',
  'food',
  'store',
  'health',
  'finance',
  'general_contractor',
  'place_of_worship',
]);

const PLACE_TYPE_LABELS_ES: Record<string, string> = {
  restaurant: 'Restaurante',
  cafe: 'Café',
  bar: 'Bar',
  bakery: 'Panadería',
  meal_takeaway: 'Comida para llevar',
  meal_delivery: 'Delivery',
  night_club: 'Boliche',
  lodging: 'Alojamiento',
  campground: 'Camping',
  rv_park: 'Camping / motorhome',
  tourist_attraction: 'Atracción turística',
  park: 'Parque',
  museum: 'Museo',
  art_gallery: 'Galería de arte',
  spa: 'Spa',
  gym: 'Gimnasio',
  beauty_salon: 'Estética',
  hair_care: 'Peluquería',
  supermarket: 'Supermercado',
  grocery_or_supermarket: 'Almacén',
  shopping_mall: 'Shopping',
  clothing_store: 'Indumentaria',
  shoe_store: 'Zapatería',
  jewelry_store: 'Joyería',
  furniture_store: 'Mueblería',
  home_goods_store: 'Hogar',
  electronics_store: 'Electrónica',
  book_store: 'Librería',
  florist: 'Florería',
  liquor_store: 'Vinoteca',
  pharmacy: 'Farmacia',
  hospital: 'Hospital',
  dentist: 'Dentista',
  veterinary_care: 'Veterinaria',
  pet_store: 'Mascotas',
  gas_station: 'Estación de servicio',
  car_rental: 'Alquiler de autos',
  car_repair: 'Taller mecánico',
  car_wash: 'Lavadero',
  car_dealer: 'Concesionaria',
  travel_agency: 'Agencia de viajes',
  real_estate_agency: 'Inmobiliaria',
  lawyer: 'Estudio jurídico',
  accountant: 'Contador',
  bank: 'Banco',
  atm: 'Cajero automático',
  church: 'Iglesia',
  school: 'Escuela',
  university: 'Universidad',
  library: 'Biblioteca',
  movie_theater: 'Cine',
  amusement_park: 'Parque de diversiones',
  bowling_alley: 'Bowling',
  stadium: 'Estadio',
  zoo: 'Zoológico',
  aquarium: 'Acuario',
  ice_cream_shop: 'Heladería',
};

export function resolvePlaceTypeLabel(types?: string[] | null): string | null {
  if (!types?.length) return null;

  for (const type of types) {
    if (GENERIC_PLACE_TYPES.has(type)) continue;
    const label = PLACE_TYPE_LABELS_ES[type];
    if (label) return label;
  }

  return null;
}

export function buildGoogleImportDescription(input: {
  editorialSummary?: string | null;
  tipo?: string | null;
  direccion?: string | null;
  nombre?: string | null;
}): string {
  const summary = input.editorialSummary?.trim();
  if (summary) return summary;

  const tipo = input.tipo?.trim();
  const direccion = input.direccion?.trim();
  if (tipo && direccion) return `${tipo} en ${direccion}.`;
  if (tipo) return tipo;

  const nombre = input.nombre?.trim();
  if (nombre && direccion) return `${nombre} en ${direccion}.`;
  return nombre || direccion || '';
}
