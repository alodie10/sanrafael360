import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, ChevronDown } from "lucide-react";
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

  // Lógica de visualización responsiva (Corte de items)
  // En móvil mostramos 4, en tablet/PC 7
  const limit = 7; // Límite base
  const showMoreInBar = categorias.length > limit;
  
  // Usamos clases de CSS para controlar la visibilidad responsiva de los items excedentes
  const displayCategorias = categorias; 

  return (
    <>
      <div className="sticky top-20 z-40 bg-background/90 backdrop-blur-xl border-b border-white/5 py-4 mb-8 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Fila de Iconos Horizontal Scroll (Pills) */}
          <div className="flex w-full overflow-x-auto gap-3 pb-2 snap-x items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Opción: Ver Todos */}
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                "flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full border transition-all shrink-0 snap-start",
                selectedCategoryDocId === null 
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-lg shadow-primary/20" 
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white font-medium"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-sm whitespace-nowrap">Todos</span>
            </button>

            {/* Categorías (Pills) */}
            {displayCategorias.map((cat) => {
              const Icon = getCategoryIcon(cat.nombre);
              const isActive = selectedCategoryDocId === cat.documentId;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.documentId)}
                  className={cn(
                    "flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full border transition-all shrink-0 snap-start",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-lg shadow-primary/20" 
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white font-medium"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-slate-400")} />
                  <span className="text-sm whitespace-nowrap">
                    {cat.nombre}
                  </span>
                </button>
              );
            })}

            {/* Botón "+ Ver todas" al final de la fila */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-all shrink-0 snap-start font-medium"
            >
              <span className="text-sm whitespace-nowrap">+ Ver todas</span>
            </button>
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
