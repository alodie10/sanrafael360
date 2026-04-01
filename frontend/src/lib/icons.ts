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
 * Mapa centralizado de iconos con raíces de palabras para máxima robustez.
 * Ignora plurales y variaciones menores.
 */
export const iconMap: Record<string, LucideIcon> = {
  "aloj": Bed,
  "caba": Bed, 
  "gastron": Utensils,
  "restauran": Utensils,
  "turismo": Mountain,
  "aventura": Mountain,
  "actividad": Mountain,
  "bodeg": Wine,
  "vin": Wine,
  "gourmet": ShoppingBasket,
  "cultura": Camera,
  "punto": MapPin,
  "excursion": MapPin,
  "apart": Hotel,
  "hotel": Hotel,
  "posada": Home,
  "viaje": Globe,
  "agencia": Globe,
  "host": Users,
};

/**
 * Mapa centralizado de gradientes basado en raíces de palabras.
 */
export const gradientMap: Record<string, string> = {
  "aloj": "from-indigo-600/80 to-violet-700/80",
  "caba": "from-blue-600/80 to-indigo-700/80",
  "gastron": "from-orange-500/80 to-red-600/80",
  "turismo": "from-emerald-500/80 to-teal-600/80",
  "bodeg": "from-amber-600/80 to-orange-700/80",
  "gourmet": "from-rose-500/80 to-pink-600/80",
  "apart": "from-blue-600/80 to-cyan-700/80",
  "hotel": "from-blue-600/80 to-cyan-700/80",
  "posada": "from-teal-600/80 to-emerald-700/80",
  "viaje": "from-sky-500/80 to-indigo-600/80",
  "host": "from-purple-600/80 to-pink-700/80",
  "default": "from-slate-700/80 to-slate-900/80",
};

/**
 * Obtiene el icono correspondiente a una categoría de forma robusta.
 * Normaliza el nombre eliminando acentos y espacios.
 */
export function getCategoryIcon(name: string): LucideIcon {
  if (!name) return Info;
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  const entry = Object.entries(iconMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : Info;
}

/**
 * Obtiene el gradiente correspondiente a una categoría.
 */
export function getCategoryGradient(name: string): string {
  if (!name) return gradientMap.default;
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  const entry = Object.entries(gradientMap).find(([key]) => 
    n.includes(key.toLowerCase())
  );
  
  return entry ? entry[1] : gradientMap.default;
}
