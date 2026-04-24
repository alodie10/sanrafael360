import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";
import CategoryDrawer from "./CategoryDrawer";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

export default function FilterBar({ categorias, selectedCategoryDocId, onSelectCategory }: FilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lógica de visualización en la barra
  const showMoreInBar = categorias.length > 8;
  const displayCategorias = showMoreInBar ? categorias.slice(0, 7) : categorias;

  return (
    <>
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4 pb-1">
            
            {/* Opción: Ver Todos */}
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] p-2 transition-all group",
                selectedCategoryDocId === null 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
              )}
            >
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Todos</span>
            </button>

            {/* Categorías Dinámicas de Strapi (Limitadas) */}
            {displayCategorias.map((cat) => {
              const Icon = getCategoryIcon(cat.nombre);
              const isActive = selectedCategoryDocId === cat.documentId;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.documentId)}
                  className={cn(
                    "flex flex-col items-center gap-2 min-w-[70px] md:min-w-[90px] p-2 transition-all group",
                    isActive 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                    {cat.nombre}
                  </span>
                </button>
              );
            })}

            {/* Botón "Más" para la barra sticky */}
            {showMoreInBar && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] p-2 transition-all group text-primary/60 hover:text-primary"
              >
                <div className="relative">
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Más</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drawer compartido */}
      <CategoryDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categorias={categorias}
        selectedCategoryDocId={selectedCategoryDocId}
        onSelectCategory={onSelectCategory}
      />
    </>
  );
}
