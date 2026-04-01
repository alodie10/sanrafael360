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
  Globe 
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
  "gastron": Utensils,
  "restauran": Utensils,
  "comid": Utensils,
  "aventura": Mountain,
  "actividad": Mountain,
  "turismo": Mountain,
  "bodeg": Wine,
  "vin": Wine,
  "gourmet": ShoppingBasket,
  "cultura": Camera,
  "museo": Camera,
  "punto": MapPin,
  "excursion": MapPin,
  "apart": Hotel,
  "posada": Home,
  "viaje": Globe,
  "agencia": Globe,
  "host": Users,
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
  "turismo": "from-emerald-500 to-teal-600",
  "bodeg": "from-amber-600 to-orange-700",
  "gourmet": "from-rose-500 to-pink-600",
  "apart": "from-blue-600 to-cyan-700",
  "posada": "from-teal-600 to-emerald-700",
  "viaje": "from-sky-500 to-indigo-600",
  "host": "from-purple-600 to-pink-700",
  "default": "from-slate-800 to-slate-900",
};

/**
 * Lógica de matching mejorada.
 */
export function getCategoryIcon(name: string): LucideIcon {
  if (!name) return Info;
  const n = name.toLowerCase().trim();
  
  // Intenta match por raíz
  const entry = Object.entries(iconMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : Info;
}

export function getCategoryGradient(name: string): string {
  if (!name) return gradientMap.default;
  const n = name.toLowerCase().trim();
  
  const entry = Object.entries(gradientMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : gradientMap.default;
}
