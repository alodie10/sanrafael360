"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

export default function FilterBar({ categorias, selectedCategoryDocId, onSelectCategory }: FilterBarProps) {
  return (
    <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
      <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 md:gap-4 pb-1">
          
          {/* Opción: Ver Todos */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[80px] p-2 transition-all group",
              selectedCategoryDocId === null 
                ? "text-primary border-b-2 border-primary" 
                : "text-slate-500 border-b-2 border-transparent hover:text-slate-200"
            )}
          >
            <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Todos</span>
          </button>

          {/* Categorías Dinámicas de Strapi */}
          {categorias.map((cat) => {
            const Icon = getCategoryIcon(cat.nombre);

            const isActive = selectedCategoryDocId === cat.documentId;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.documentId)}
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
