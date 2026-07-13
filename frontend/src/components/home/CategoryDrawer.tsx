"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LayoutGrid, ChevronRight, ChevronLeft } from "lucide-react";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { isMainCategoria, isSubcategoriaOf } from "@/lib/categoria-utils";

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
  const [view, setView] = useState<{ type: 'main' | 'sub', parentId: string | null }>({ type: 'main', parentId: null });

  const getSubcategories = (parentId: string) => {
    return categorias.filter(c => isSubcategoriaOf(c, parentId));
  };

  const mainCategorias = categorias.filter(isMainCategoria);

  const handleCategoryClick = (cat: Categoria) => {
    const subs = getSubcategories(cat.documentId);
    if (subs.length > 0) {
      setView({ type: 'sub', parentId: cat.documentId });
    } else {
      onSelectCategory(cat.documentId);
      onClose();
    }
  };

  const parentCat = view.parentId ? categorias.find(c => c.documentId === view.parentId) : null;
  const currentSubs = view.parentId ? getSubcategories(view.parentId) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950 border-l border-white/10 z-[151] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              {view.type === 'sub' ? (
                <button onClick={() => setView({ type: 'main', parentId: null })} className="flex items-center gap-2 text-primary group">
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-bold text-sm uppercase tracking-widest">Volver</span>
                </button>
              ) : (
                <div>
                  <h2 className="text-xl font-serif font-bold text-white italic">Categorías</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Explora San Rafael</p>
                </div>
              )}
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {view.type === 'main' ? (
                <>
                  <button
                    onClick={() => { onSelectCategory(null); onClose(); }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl transition-all border",
                      selectedCategoryDocId === null 
                        ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(255,191,0,0.2)]" 
                        : "bg-white/5 text-zinc-400 border-transparent hover:border-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <LayoutGrid className="w-5 h-5" />
                      <span className="font-bold uppercase tracking-widest text-[11px]">Ver Todo</span>
                    </div>
                  </button>

                  <div className="h-2" />

                  {mainCategorias.map((cat) => {
                    const Icon = getCategoryIcon(cat.nombre);
                    const subs = getSubcategories(cat.documentId);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 text-zinc-400 border border-transparent hover:border-white/10 hover:text-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <Icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                          <span className="font-bold uppercase tracking-widest text-[11px]">{cat.nombre}</span>
                        </div>
                        {subs.length > 0 && <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="px-2 py-4">
                    <h3 className="text-primary font-black uppercase tracking-tighter text-2xl">{parentCat?.nombre}</h3>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Selecciona una subcategoría</p>
                  </div>
                  
                  <button
                    onClick={() => { onSelectCategory(view.parentId); onClose(); }}
                    className="w-full text-left p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] uppercase tracking-widest mb-4"
                  >
                    Ver Todo en {parentCat?.nombre}
                  </button>

                  {currentSubs.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { onSelectCategory(sub.documentId); onClose(); }}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 text-zinc-400 border border-transparent hover:border-white/10 hover:text-white transition-all"
                    >
                      <span className="font-bold uppercase tracking-widest text-[11px]">{sub.nombre}</span>
                      <ChevronRight className="w-4 h-4 opacity-20" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5">
              <p className="text-[9px] text-zinc-600 text-center uppercase tracking-[0.3em]">San Rafael 360 • 2026</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
