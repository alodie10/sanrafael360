"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LayoutGrid } from "lucide-react";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

export default function CategoryDrawer({ 
  isOpen, 
  onClose, 
  categorias, 
  selectedCategoryDocId, 
  onSelectCategory 
}: CategoryDrawerProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Panel Lateral */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header del Drawer */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white italic">Explorar Categorías</h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Guía San Rafael 360</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Lista de Categorías */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
              {/* Opción: Todos */}
              <button
                onClick={() => { onSelectCategory(null); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border",
                  selectedCategoryDocId === null 
                    ? "bg-primary text-black border-primary" 
                    : "bg-white/5 text-zinc-400 border-transparent hover:border-white/10 hover:text-white"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Ver Todos los Negocios</span>
              </button>

              <div className="h-4" /> {/* Separador */}

              {/* Categorías Dinámicas */}
              {categorias.map((cat) => {
                const Icon = getCategoryIcon(cat.nombre);
                const isActive = selectedCategoryDocId === cat.documentId;

                return (
                  <button
                    key={cat.id}
                    onClick={() => { onSelectCategory(cat.documentId); onClose(); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border",
                      isActive 
                        ? "bg-primary text-black border-primary" 
                        : "bg-white/5 text-zinc-400 border-transparent hover:border-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">{cat.nombre}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer Informativo */}
            <div className="p-8 bg-black/40 border-t border-white/5">
              <p className="text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em]">
                San Rafael 360 • 2026
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
