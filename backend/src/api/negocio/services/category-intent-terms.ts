/**
 * Producto/intención → rubro. Se indexa en cada comercio del rubro.
 * Claves: slug y nombre normalizado (sin acentos, no alfanumérico → _).
 */
export const CATEGORY_INTENT_GROUPS: { keys: string[]; terms: string[] }[] = [
  {
    keys: ['ferreterias'],
    terms: [
      'martillo', 'tornillo', 'tornillos', 'clavo', 'clavos', 'taladro', 'destornillador',
      'alicate', 'pinza', 'llave inglesa', 'sierra', 'tuerca', 'tuercas', 'bulon',
      'candado', 'cerradura', 'pintura', 'brocha', 'rodillo', 'herramienta', 'herramientas',
      'mecha', 'disco de corte', 'cinta aisladora', 'silicona',
    ],
  },
  {
    keys: ['talleres_gomerias', 'talleres_mecanicos_gomerias'],
    terms: [
      'neumatico', 'neumaticos', 'llanta', 'llantas', 'cubierta', 'cubiertas',
      'goma', 'gomas', 'gomeria', 'gomerias', 'pinchadura', 'alineacion', 'balanceo',
      'valvula', 'camara de aire', 'reparacion de gomas',
    ],
  },
  {
    keys: ['repuestos_automotor', 'repuestos_automotrices'],
    terms: [
      'pastillas de freno', 'pastillas', 'freno', 'frenos', 'disco de freno', 'discos de freno',
      'amortiguador', 'amortiguadores', 'bujia', 'bujias', 'filtro', 'filtros',
      'correa', 'radiador', 'bateria', 'aceite de motor', 'repuesto', 'repuestos',
    ],
  },
  {
    keys: ['materiales_de_construccion'],
    terms: [
      'cemento', 'cal', 'arena', 'ladrillo', 'ladrillos', 'hierro', 'revoque',
      'membrana', 'ceramico', 'ceramicos', 'porcelanato', 'pegamento',
    ],
  },
  {
    keys: ['lavadero_autos', 'lavadero_de_autos'],
    terms: ['lavado', 'lavadero', 'detailing', 'encerado', 'tapizado', 'motor'],
  },
  {
    keys: ['agencia_autos', 'alquiler_venta_de_autos'],
    terms: ['alquiler de auto', 'rent a car', 'usado', 'usados', '0km', 'patente'],
  },
  {
    keys: ['mascotas_veterinarias', 'mascotas_y_veterinarias'],
    terms: [
      'veterinaria', 'perro', 'gato', 'vacuna', 'vacunas', 'alimento', 'balanceado',
      'peluqueria canina', 'antipulgas',
    ],
  },
  {
    keys: ['pesca_y_camping'],
    terms: [
      'caña', 'reel', 'anzuelo', 'carnada', 'carpa', 'conservadora', 'camping',
      'sleeping', 'linterna', 'pesca',
    ],
  },
  {
    keys: ['hogar_deco', 'hogar_y_decoracion'],
    terms: ['sillon', 'mesa', 'lampara', 'cortina', 'alfombra', 'cuadro', 'deco', 'muebles'],
  },
  {
    keys: ['indumentaria'],
    terms: ['ropa', 'zapatilla', 'zapatillas', 'jean', 'campera', 'remera', 'calzado', 'buzo'],
  },
  {
    keys: ['belleza_estetica'],
    terms: ['peluqueria', 'uñas', 'manicura', 'depilacion', 'tintura', 'corte de pelo', 'barberia'],
  },
  {
    keys: ['salud_bienestar', 'salud_y_bienestar'],
    terms: ['farmacia', 'kinesiologia', 'dentista', 'odontologo', 'turno medico', 'gimnasio'],
  },
  {
    keys: ['servicios_profesionales'],
    terms: ['abogado', 'contador', 'escribania', 'arquitecto', 'estudio'],
  },
  {
    keys: ['servicios_para_el_hogar', 'servicios_para_el_hogar_y_tecno'],
    terms: [
      'gasista', 'plomero', 'electricista', 'aire acondicionado', 'tecnico',
      'reparacion', 'heladera', 'lavarropas',
    ],
  },
  {
    keys: ['inmobiliarias'],
    terms: ['alquiler', 'venta', 'departamento', 'casa', 'lote', 'tasacion'],
  },
  {
    keys: ['agencias_de_viaje', 'agencia_de_viajes'],
    terms: ['pasaje', 'paquete', 'excursion', 'vuelo', 'hotel'],
  },
  {
    keys: ['entretenimientos'],
    terms: ['cine', 'boliche', 'karaoke', 'juegos', 'pool', 'bowling'],
  },
  {
    keys: ['interes_turistico'],
    terms: ['dique', 'canon', 'mirador', 'cascada', 'visita'],
  },
  {
    keys: ['gastronomia'],
    terms: ['comer', 'almorzar', 'cenar', 'menu', 'plato', 'carta'],
  },
  {
    keys: ['pizzeria'],
    terms: ['pizza', 'muzza', 'muzzarella', 'empanada', 'empanadas', 'fugazzetta'],
  },
  {
    keys: ['hamburgueseria'],
    terms: ['hamburguesa', 'hamburguesas', 'burger', 'paty'],
  },
  {
    keys: ['cerveceria'],
    terms: ['cerveza', 'pinta', 'ipa', 'chop'],
  },
  {
    keys: ['restaurante'],
    terms: ['parrilla', 'asado', 'milanesa', 'pasta', 'almuerzo', 'cena'],
  },
  {
    keys: ['bar'],
    terms: ['trago', 'tragos', 'cerveza', 'after'],
  },
  {
    keys: ['panaderia'],
    terms: ['pan', 'facturas', 'medialunas', 'torta', 'sandwich'],
  },
  {
    keys: ['comida_para_llevar'],
    terms: ['delivery', 'vianda', 'viandas', 'para llevar'],
  },
  {
    keys: ['sushi'],
    terms: ['roll', 'rolls', 'sashimi', 'nigiri'],
  },
  {
    keys: ['cafe'],
    terms: ['cafe', 'cappuccino', 'medialuna', 'brunch', 'tostado'],
  },
  {
    keys: ['heladeria'],
    terms: ['helado', 'helados', 'cucurucho', 'kg de helado'],
  },
  {
    keys: ['bodegas'],
    terms: ['vino', 'vinos', 'malbec', 'degustacion', 'bodega', 'cava'],
  },
  {
    keys: ['productos_regionales'],
    terms: ['regalo', 'souvenir', 'artesania', 'regional'],
  },
  {
    keys: ['aceite_de_oliva'],
    terms: ['aceite', 'oliva', 'olivo'],
  },
  {
    keys: ['alfajores'],
    terms: ['alfajor', 'dulce de leche'],
  },
  {
    keys: ['delicatessen', 'vinos_delicatessen'],
    terms: ['fiambre', 'queso', 'picada', 'vino'],
  },
  {
    keys: ['categoria', 'alojamientos'],
    terms: ['alojamiento', 'hospedaje', 'dormir', 'noche'],
  },
  {
    keys: ['hoteles'],
    terms: ['hotel', 'desayuno'],
  },
  {
    keys: ['cabanas'],
    terms: ['cabana', 'cabanas', 'quincho'],
  },
  {
    keys: ['apart_hoteles'],
    terms: ['apart', 'departamento'],
  },
  {
    keys: ['hostels'],
    terms: ['hostel', 'mochilero', 'dormis'],
  },
  {
    keys: ['posadas'],
    terms: ['posada', 'desayuno'],
  },
  {
    keys: ['turismo_aventura'],
    terms: ['aventura', 'aire libre', 'excursion'],
  },
  {
    keys: ['rafting'],
    terms: ['rafting', 'rio', 'kayak'],
  },
  {
    keys: ['trekking'],
    terms: ['trekking', 'caminata', 'montana'],
  },
  {
    keys: ['cabalgata'],
    terms: ['cabalgata', 'caballo', 'caballos'],
  },
];
