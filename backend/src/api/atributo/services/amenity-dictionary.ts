export type PatternKind = 'alta' | 'ambigua';

export type DictionaryPattern = {
  slug: string;
  kind: PatternKind;
  re: RegExp;
  rejectNear?: RegExp;
  route?: 'parking-private' | 'parking-public' | 'delivery';
};

export const AMENITY_PATTERNS: DictionaryPattern[] = [
  { slug: 'wifi', kind: 'alta', re: /\bwi[\s-]?fi\b|\binternet\b|\bwifi\b/g },
  { slug: 'aire-acondicionado', kind: 'alta', re: /\baire acondicionado\b|\baire split\b/g },
  { slug: 'aire-acondicionado', kind: 'alta', re: /\bclimatizad[oa]s?\b/g, rejectNear: /\b(pileta|piscina)\b/ },
  { slug: 'calefaccion', kind: 'alta', re: /\bcalefaccion\b|\blosa radiante\b|\bcalefactor\b/g },
  { slug: 'cocina-equipada', kind: 'alta', re: /\bcocina equipada\b|\bcocina completa\b|\bcocina integral\b|\bcocina full\b|\bequipamiento de cocina\b|\bcocina completament\w*/g },
  { slug: 'cocina-equipada', kind: 'ambigua', re: /\bcocina\b/g },
  { slug: 'heladera', kind: 'alta', re: /\bheladera\b|\bnevera\b|\brefrigerador\b/g },
  { slug: 'microondas', kind: 'alta', re: /\bmicroondas\b/g },
  { slug: 'vajilla', kind: 'alta', re: /\bvajilla completa\b/g },
  { slug: 'vajilla', kind: 'ambigua', re: /\bvajilla\b/g },
  { slug: 'tv-directv', kind: 'alta', re: /\bdirect\s*tv\b|\btelevision\b|\bsmart\s*tv\b|\btv\b/g },
  { slug: 'desayuno', kind: 'alta', re: /\bdesayuno\b/g },
  { slug: 'ropa-blanca', kind: 'alta', re: /\bropa blanca\b|\bropa de cama\b|\bsabanas\b|\btoallas\b|\btoallones\b|\bjuego de blanco\b/g },
  { slug: 'alarma', kind: 'alta', re: /\balarma\b|\bsistema de alarma\b/g, rejectNear: /\b(reloj|despertador)\b/ },
  { slug: 'servicio-de-emergencia-medica', kind: 'alta', re: /\bemergencia medica\b|\bservicio medico\b|\basistencia medica\b|\bmedico de guardia\b/g },
  { slug: 'piscina', kind: 'alta', re: /\bpiletas?\b|\bpiscina\b|\bnatatorio\b/g },
  { slug: 'hidromasaje', kind: 'alta', re: /\bhidromasaje\b|\bjacuzzis?\b|\btinaja\b/g },
  { slug: 'hidromasaje', kind: 'ambigua', re: /\bspa\b/g },
  { slug: 'parque-jardin', kind: 'alta', re: /\bjardin\b|\bespacio verde\b/g, rejectNear: /\binfantes\b|\bbancos de jardin\b|\bmuebles de jardin\b/ },
  { slug: 'parque-jardin', kind: 'ambigua', re: /\bparque\b/g, rejectNear: /\b(industrial|nacional|provincial|hipolito|yrigoyen)\b/ },
  { slug: 'parrilla-quincho', kind: 'alta', re: /\bquincho\b|\basador\b|\bchurrasquera\b|\bparrilla\b/g },
  { slug: 'pet-friendly', kind: 'alta', re: /\bpet[\s-]?friendly\b|\bse aceptan mascotas\b|\baceptamos mascotas\b|\bmascotas bienvenidas\b/g },
  { slug: 'pet-friendly', kind: 'ambigua', re: /\bmascotas\b|\bperros?\b/g },
  { slug: 'accesible', kind: 'alta', re: /\bsilla de ruedas\b|\brampa de acceso\b|\bmovilidad reducida\b/g },
  { slug: 'accesible', kind: 'ambigua', re: /\baccesible\b/g },
  { slug: 'lavarropas', kind: 'alta', re: /\blavarropas\b|\blava ropas\b|\blavadora\b/g },
  { slug: 'lavarropas', kind: 'ambigua', re: /\blavadero\b/g, rejectNear: /\b(auto|autos|coche|coches)\b/ },
  { slug: 'juegos-para-ninos', kind: 'alta', re: /\bjuegos para ninos\b|\bplaza de juegos\b|\bpelotero\b|\bjuegos infantiles\b/g },
  { slug: 'take-away', kind: 'alta', re: /\btake[\s-]?away\b|\bpara llevar\b/g },
  { slug: 'reservas', kind: 'alta', re: /\bcon reserva\b|\baceptamos reservas\b|\breserva previa\b|\breservas\b/g },
  { slug: 'reservas', kind: 'ambigua', re: /\breserva\b/g, rejectNear: /\b(natural|ecologica|provincial)\b/ },
  { slug: 'apto-celiacos', kind: 'alta', re: /\bceliac[oa]s?\b|\bsin tacc\b|\bsin gluten\b|\bapto celiacos\b/g },
  { slug: 'vegano-vegetariano', kind: 'alta', re: /\bvegan[oa]s?\b|\bvegetarian[oa]s?\b|\bveggie\b/g },
  { slug: 'terraza-aire-libre', kind: 'alta', re: /\bterraza\b|\bal aire libre\b|\baire libre\b/g },
  { slug: 'terraza-aire-libre', kind: 'ambigua', re: /\bpatio\b/g },
  { slug: 'musica-en-vivo', kind: 'alta', re: /\bmusica en vivo\b|\bshow en vivo\b|\bbanda en vivo\b/g },
  { slug: 'tarjetas-mercado-pago', kind: 'alta', re: /\bmercado\s*pago\b|\btarjeta de credito\b|\btarjeta de debito\b|\baceptamos tarjetas\b|\btodas las tarjetas\b/g },
  { slug: 'tarjetas-mercado-pago', kind: 'ambigua', re: /\btarjetas\b/g },
  { slug: 'turnos-online', kind: 'alta', re: /\bturnos? online\b|\bsaca turno\b|\breserva de turno\b/g },
  { slug: 'turnos-online', kind: 'ambigua', re: /\bturnos\b/g },
  { slug: 'atencion-24-hs', kind: 'alta', re: /\b24\s*hs\b|\b24\s*horas\b|\blas 24 horas\b|\batencion 24\b/g },
  { slug: 'presupuesto-sin-cargo', kind: 'alta', re: /\bpresupuesto sin cargo\b|\bpresupuesto gratis\b|\bpresupuesto gratuito\b/g },
  { slug: 'garantia', kind: 'alta', re: /\bgarantia\b/g },
  { slug: 'cochera', kind: 'alta', re: /\bcochera\b|\bgarage\b|\bgaraje\b/g, route: 'parking-private' },
  { slug: 'estacionamiento', kind: 'alta', re: /\bestacionamiento\b|\bparking\b|\baparcamiento\b/g, route: 'parking-public' },
  { slug: 'delivery', kind: 'alta', re: /\bdelivery\b|\benvio a domicilio\b|\benvios a domicilio\b|\benviamos\b/g, route: 'delivery' },
];
