"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Categoria } from "@/types/strapi";
import CategoryCard from "./CategoryCard";
import CategoryDrawer from "./CategoryDrawer";
import { Plus } from "lucide-react";

interface CategoryGridProps {
  categorias: Categoria[];
  loading: boolean;
  onSelectCategory?: (docId: string | null) => void;
}

export default function CategoryGrid({ categorias, loading, onSelectCategory }: CategoryGridProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="h-48 md:h-56 rounded-3xl bg-white/5 border border-white/5 animate-pulse" 
          />
        ))}
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Lógica de visualización: Si hay más de 8, mostramos 7 + el botón de "Más"
  const showMoreButton = categorias.length > 8;
  const displayCategorias = showMoreButton ? categorias.slice(0, 7) : categorias;

  return (
    <>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {displayCategorias.map((categoria, index) => (
          <CategoryCard 
            key={categoria.id} 
            categoria={categoria} 
            index={index} 
            onSelect={onSelectCategory}
          />
        ))}

        {/* Botón de Ver Más (Solo si hay excedente) */}
        {showMoreButton && (
          <motion.button
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            onClick={() => setIsDrawerOpen(true)}
            className="group relative h-48 md:h-56 rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 hover:border-primary/50 transition-all shadow-2xl flex flex-col items-center justify-center gap-4 active:scale-95"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-black" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary">Explorar</span>
              <span className="block text-xl font-serif font-bold text-white italic">Todas</span>
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* Drawer con la lista completa */}
      <CategoryDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categorias={categorias}
        selectedCategoryDocId={null} // El drawer es para navegar, no para reflejar el filtro actual en esta vista
        onSelectCategory={(id) => onSelectCategory?.(id)}
      />
    </>
  );
}
