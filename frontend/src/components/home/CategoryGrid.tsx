"use client";

import { motion } from "framer-motion";
import { Categoria } from "@/types/strapi";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
  categorias: Categoria[];
  loading: boolean;
  onSelectCategory?: (docId: string | null) => void;
}

export default function CategoryGrid({ categorias, loading, onSelectCategory }: CategoryGridProps) {
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

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {categorias.map((categoria, index) => (
        <CategoryCard 
          key={categoria.id} 
          categoria={categoria} 
          index={index} 
          onSelect={onSelectCategory}
        />
      ))}
    </motion.div>
  );
}
