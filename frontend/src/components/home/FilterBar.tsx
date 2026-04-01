"use client";

import { motion } from "framer-motion";
import { LucideIcon, Bed, Utensils, Mountain, Wine, Camera, MapPin, LayoutGrid, ShoppingBasket, Hotel, Home, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

/**
 * Mapeo de iconos para las categorías principales. 
 * Incluye la normalización de "Productos Gourmet".
 */
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

export default function FilterBar({ categorias, selectedCategoryId, onSelectCategory }: FilterBarProps) {
  return (
    <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
      <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 md:gap-4 pb-1">
          
          {/* Opción: Ver Todos */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[80px] p-2 transition-all group",
              selectedCategoryId === null 
                ? "text-primary border-b-2 border-primary" 
                : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
            )}
          >
            <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Todos</span>
          </button>

          {/* Categorías Dinámicas de Strapi */}
          {categorias.map((cat) => {
            const Icon = Object.entries(iconMap).find(([key]) => 
              cat.nombre.toLowerCase().includes(key.toLowerCase())
            )?.[1] || MapPin;

            const isActive = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[100px] p-2 transition-all group",
                  isActive 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {cat.nombre}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
