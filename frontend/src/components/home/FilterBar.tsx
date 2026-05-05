import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

export default function FilterBar({ categorias, selectedCategoryDocId, onSelectCategory }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Lógica de Categorías Principales y Subcategorías
  const mainCategorias = categorias.filter(c => !c.parent);
  const selectedCategory = categorias.find(c => c.documentId === selectedCategoryDocId);
  const activeParentId = selectedCategory?.parent?.documentId || selectedCategory?.documentId;
  const subcategorias = categorias.filter(c => c.parent?.documentId === activeParentId);
  const showSubcategories = subcategorias.length > 0 && selectedCategoryDocId !== null;

  // Límite inicial de categorías principales a mostrar (para ocupar ~2 filas dependiendo del dispositivo)
  const limit = 7;
  const hasMore = mainCategorias.length > limit;
  const displayCategorias = isExpanded ? mainCategorias : mainCategorias.slice(0, limit);

  return (
    <>
      <div className="sticky top-20 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5 py-4 mb-8 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Fila de Iconos Flex Wrap (Pills) */}
          <motion.div layout className="flex flex-wrap justify-center gap-2 md:gap-3">
            
            {/* Opción: Ver Todos */}
            <motion.button
              layout
              onClick={() => onSelectCategory(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                selectedCategoryDocId === null 
                  ? "bg-white text-black border-white shadow-md" 
                  : "bg-white/15 text-white border-white/10 hover:bg-white/25 font-medium"
              )}
            >
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm whitespace-nowrap">Todas</span>
            </motion.button>

            {/* Categorías (Pills) */}
            {displayCategorias.map((cat) => {
              const Icon = getCategoryIcon(cat.nombre);
              // La categoría principal se ilumina si está seleccionada directamente, O si una de sus subcategorías está seleccionada.
              const isActive = activeParentId === cat.documentId;

              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.documentId)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    isActive 
                      ? "bg-primary text-black border-primary font-bold shadow-[0_0_20px_rgba(255,191,0,0.4)]" 
                      : "bg-white/15 text-white border-white/10 hover:bg-white/25 font-medium"
                  )}
                >
                  <Icon className={cn("w-4 h-4 md:w-5 md:h-5", isActive ? "text-primary-foreground" : "text-slate-400")} />
                  <span className="text-xs md:text-sm whitespace-nowrap">
                    {cat.nombre}
                  </span>
                </motion.button>
              );
            })}

            {/* Botón "+ Ver todas / Ver menos" */}
            {hasMore && (
              <motion.button
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-all font-medium"
              >
                {isExpanded ? (
                  <span className="text-xs md:text-sm whitespace-nowrap">- Ver menos</span>
                ) : (
                  <span className="text-xs md:text-sm whitespace-nowrap">+ Ver todas ({mainCategorias.length - limit})</span>
                )}
              </motion.button>
            )}
          </motion.div>

          {/* Subcategorías Bar - flex-wrap para mobile */}
          {showSubcategories && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-white/5 items-center justify-center"
            >
              <button
                onClick={() => onSelectCategory(activeParentId!)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  selectedCategoryDocId === activeParentId
                    ? "bg-white text-black border-white shadow-md"
                    : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                )}
              >
                Todas
              </button>

              {subcategorias.map(sub => {
                const isSubActive = selectedCategoryDocId === sub.documentId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectCategory(sub.documentId)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      isSubActive
                        ? "bg-white text-black border-white shadow-md"
                        : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {sub.nombre}
                  </button>
                )
              })}
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}
