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
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          
          {/* Fila de Iconos Centrada */}
          <div className="flex flex-wrap justify-center items-center gap-1 md:gap-4">
            
            {/* Opción: Ver Todos */}
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[65px] md:min-w-[80px] p-2 transition-all group",
                selectedCategoryDocId === null 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
              )}
            >
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Todos</span>
            </button>

            {/* Categorías Dinámicas (Controlamos visibilidad con CSS para ser 100% responsivos) */}
            {displayCategorias.map((cat, index) => {
              const Icon = getCategoryIcon(cat.nombre);
              const isActive = selectedCategoryDocId === cat.documentId;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.documentId)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 min-w-[65px] md:min-w-[90px] p-2 transition-all group",
                    // Responsivo: Ocultar después del 4to en móvil, después del 7mo en tablet
                    index >= 3 ? "hidden sm:flex" : "flex",
                    index >= 7 ? "md:hidden lg:flex" : "",
                    index >= 9 ? "hidden" : "", // Nunca mostrar más de 9 en la barra
                    isActive 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                    {cat.nombre}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Botón "Más" Centrado Debajo (Solo si hay excedente) */}
          {showMoreInBar && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-primary/30 transition-all group"
            >
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-primary transition-colors">Ver todas las categorías</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-primary group-hover:translate-y-0.5 transition-all" />
            </button>
          )}
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
