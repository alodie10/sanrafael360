"use client";

import { motion } from "framer-motion";
import { LucideIcon, Bed, Utensils, Mountain, Wine, Camera, MapPin, Info, ShoppingBasket, Hotel, Home, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";

interface CategoryCardProps {
  categoria: Categoria;
  index: number;
}

const iconMap: Record<string, LucideIcon> = {
  "Alojamiento": Bed,
  "Alojamiento Especial": Bed,
  "Gastronomía": Utensils,
  "Restaurantes": Utensils,
  "Actividades": Mountain,
  "Turismo Aventura": Mountain,
  "Bodegas": Wine,
  "Vinos": Wine,
  "Productos Gourmet": ShoppingBasket,
  "Cultura": Camera,
  "Puntos de Interés": MapPin,
  "Apart Hoteles": Hotel,
  "Posadas": Home,
  "Agencias de Viaje": Globe,
  "Hostels": Users,
};

const gradientMap: Record<string, string> = {
  "Alojamiento": "from-indigo-600 to-violet-600",
  "Gastronomía": "from-orange-500 to-red-600",
  "Actividades": "from-emerald-500 to-teal-600",
  "Bodegas": "from-amber-600 to-orange-700",
  "Productos Gourmet": "from-rose-500 to-pink-600",
  "Apart Hoteles": "from-blue-600 to-cyan-600",
  "Posadas": "from-teal-600 to-emerald-600",
  "Agencias de Viaje": "from-sky-500 to-indigo-500",
  "Hostels": "from-purple-600 to-pink-600",
  "Default": "from-slate-700 to-slate-900",
};

export default function CategoryCard({ categoria, index }: CategoryCardProps) {
  const Icon = Object.entries(iconMap).find(([key]) => 
    categoria.nombre.toLowerCase().includes(key.toLowerCase())
  )?.[1] || Info;

  const gradient = Object.entries(gradientMap).find(([key]) => 
    categoria.nombre.toLowerCase().includes(key.toLowerCase())
  )?.[1] || gradientMap.Default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="group cursor-pointer"
    >
      <div className={cn(
        "relative h-48 md:h-56 rounded-3xl overflow-hidden shadow-xl transition-all duration-500 border border-white/10",
        "bg-gradient-to-br",
        gradient
      )}>
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
        
        {/* Animated Icon Container */}
        <div className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all duration-500">
          <Icon className="w-6 h-6 text-white group-hover:scale-110 group-hover:rotate-6 transition-transform" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-1 tracking-tight">
            {categoria.nombre}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm">
              {categoria.negocios?.length || 0} Lugares
            </span>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -skew-x-12 translate-x-full group-hover:-translate-x-full" />
      </div>
    </motion.div>
  );
}
