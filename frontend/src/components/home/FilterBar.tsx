"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

/**
 * FilterBar — Solo muestra la barra de subcategorías cuando una categoría
 * principal está seleccionada y tiene hijos.
 * Las categorías principales viven en el Navbar (Split Search + Category Nav).
 */
export default function FilterBar({ categorias, selectedCategoryDocId, onSelectCategory }: FilterBarProps) {
  // Lógica de subcategorías
  const selectedCategory = categorias.find(c => c.documentId === selectedCategoryDocId);
  const activeParentId = selectedCategory?.parent?.documentId || selectedCategory?.documentId;
  const subcategorias = categorias.filter(c => c.parent?.documentId === activeParentId);
  const showSubcategories = subcategorias.length > 0 && selectedCategoryDocId !== null;

  // Si no hay subcategorías, no renderizamos nada
  if (!showSubcategories) return null;

  return (
    <div className="sticky top-[130px] md:top-[138px] z-40 bg-background/90 backdrop-blur-xl border-b border-white/[0.06] py-2.5 mb-6 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-2 items-center"
        >
          {/* Opción "Todas" para la categoría padre */}
          <button
            onClick={() => onSelectCategory(activeParentId!)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              selectedCategoryDocId === activeParentId
                ? "bg-white text-black border-white shadow-md"
                : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
            )}
          >
            Todas
          </button>

          {/* Subcategorías */}
          {subcategorias.map(sub => {
            const isSubActive = selectedCategoryDocId === sub.documentId;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectCategory(sub.documentId)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  isSubActive
                    ? "bg-white text-black border-white shadow-md"
                    : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                )}
              >
                {sub.nombre}
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
