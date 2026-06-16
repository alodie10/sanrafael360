import { 
  LucideIcon, 
  Bed, 
  Utensils, 
  Mountain, 
  Wine, 
  Camera, 
  MapPin, 
  Info, 
  ShoppingBasket, 
  Hotel, 
  Home, 
  Users, 
  Globe,
  Waves,
  Store,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  Scissors,
  HeartPulse,
  Pill,
  Beer,
  Music,
  Ticket,
  Dumbbell,
  Car,
  Bus,
  Sparkles,
  Briefcase,
  Coffee,
  Pizza,
  Building,
  Hammer,
  HardHat,
  Zap,
  Droplet,
  Paintbrush,
  Snowflake,
  Glasses,
  Scale,
  Calculator,
  PawPrint,
  Sofa
} from "lucide-react";

/**
 * Mapa centralizado de iconos. 
 * Usamos raíces de palabras para máxima compatibilidad.
 */
export const iconMap: Record<string, LucideIcon> = {
  "hoteles": Hotel,
  "hotel": Hotel,
  "caba": Bed, 
  "aloj": Bed,
  "apart": Hotel,
  "posada": Home,
  "host": Users,
  "camping": Mountain,
  "gastron": Utensils,
  "restauran": Utensils,
  "comid": Utensils,
  "rotiseria": Utensils,
  "cafe": Coffee,
  "cafeteria": Coffee,
  "pizza": Pizza,
  "pizzer": Pizza,
  "bar": Beer,
  "cervez": Beer,
  "pub": Beer,
  "aventura": Waves,
  "actividad": Waves,
  "turismo": Waves,
  "rafting": Waves,
  "excursion": MapPin,
  "viaje": Globe,
  "agencia": Globe,
  "bodeg": Wine,
  "vin": Wine,
  "gourmet": ShoppingBasket,
  "regional": ShoppingBasket,
  "cultura": Camera,
  "museo": Camera,
  "punto": MapPin,
  "tienda": Store,
  "ropa": ShoppingBag,
  "indumentaria": ShoppingBag,
  "supermercado": ShoppingCart,
  "kiosco": Store,
  "almacen": ShoppingBasket,
  "taller": Wrench,
  "mecanic": Wrench,
  "repuesto": Wrench,
  "gomeria": Wrench,
  "lavadero": Droplet,
  "servicio": Briefcase,
  "ferreteria": Hammer,
  "herramienta": Hammer,
  "corralon": HardHat,
  "construccion": HardHat,
  "material": HardHat,
  "abertura": Building,
  "metalurgica": Hammer,
  "plomer": Droplet,
  "electricista": Zap,
  "gasista": Droplet,
  "pintor": Paintbrush,
  "climatizacion": Snowflake,
  "refrigeracion": Snowflake,
  "inmobiliaria": Building,
  "bienes": Building,
  "peluqueria": Scissors,
  "barberia": Scissors,
  "estetica": Sparkles,
  "spa": Sparkles,
  "farmacia": Pill,
  "salud": HeartPulse,
  "medic": HeartPulse,
  "clinica": HeartPulse,
  "optica": Glasses,
  "abogad": Scale,
  "estudio": Briefcase,
  "arquitect": Building,
  "contable": Calculator,
  "mascota": PawPrint,
  "veterinaria": PawPrint,
  "pet": PawPrint,
  "cine": Ticket,
  "teatro": Ticket,
  "musica": Music,
  "boliche": Music,
  "gym": Dumbbell,
  "gimnasio": Dumbbell,
  "club": Dumbbell,
  "deporte": Dumbbell,
  "auto": Car,
  "taxi": Car,
  "remis": Car,
  "transporte": Bus,
  "hogar": Sofa,
  "decoracion": Sofa,
  "mueble": Sofa,
  "muebleria": Sofa,
  "living": Sofa,
};

/**
 * Mapa centralizado de gradientes.
 */
export const gradientMap: Record<string, string> = {
  "hoteles": "from-blue-600 to-cyan-700",
  "hotel": "from-blue-600 to-cyan-700",
  "aloj": "from-indigo-600 to-violet-700",
  "caba": "from-blue-600 to-indigo-700",
  "gastron": "from-orange-500 to-red-600",
  "turismo": "from-cyan-500 to-blue-600",
  "bodeg": "from-amber-600 to-orange-700",
  "gourmet": "from-rose-500 to-pink-600",
  "apart": "from-blue-600 to-cyan-700",
  "posada": "from-amber-600 to-yellow-700",
  "viaje": "from-sky-500 to-indigo-600",
  "host": "from-purple-600 to-pink-700",
  "tienda": "from-emerald-500 to-teal-700",
  "ropa": "from-pink-500 to-rose-700",
  "taller": "from-slate-600 to-slate-800",
  "salud": "from-red-500 to-rose-700",
  "estetica": "from-fuchsia-500 to-purple-700",
  "bar": "from-amber-500 to-yellow-600",
  "deporte": "from-green-500 to-emerald-700",
  "transporte": "from-slate-500 to-zinc-700",
  "ferreteria": "from-orange-600 to-red-700",
  "construccion": "from-stone-500 to-stone-700",
  "inmobiliaria": "from-blue-700 to-indigo-900",
  "mascota": "from-amber-400 to-orange-500",
  "abogad": "from-slate-700 to-zinc-900",
  "climatizacion": "from-cyan-400 to-blue-500",
  "hogar": "from-amber-500 to-orange-600",
  "decoracion": "from-amber-500 to-orange-600",
  "mueble": "from-amber-600 to-yellow-700",
  "default": "from-slate-800 to-slate-900",
};

/**
 * Lógica de matching mejorada.
 */
export function getCategoryIcon(name: string): LucideIcon {
  if (!name) return Info;
  const n = name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Intenta match por raíz
  const entry = Object.entries(iconMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : Info;
}

export function getCategoryGradient(name: string): string {
  if (!name) return gradientMap.default;
  const n = name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const entry = Object.entries(gradientMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : gradientMap.default;
}
