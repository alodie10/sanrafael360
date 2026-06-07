"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, LayoutGrid,
  Plane, Hotel, Wine, UtensilsCrossed, ShoppingBag, Mountain,
  Scissors, Stethoscope, Car, Hammer, GraduationCap, Music,
  Dumbbell, PawPrint, Camera, Sparkles, TreePine, Store,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Categoria } from "@/types/strapi";

interface FilterBarProps {
  categorias: Categoria[];
  selectedCategoryDocId: string | null;
  onSelectCategory: (docId: string | null) => void;
}

/** Carrusel horizontal reutilizable con flechas */
function PillCarousel({ children, arrowAlign = "center" }: { children: React.ReactNode; arrowAlign?: "center" | "icon" }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    // Also check on resize for responsiveness
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Flecha izquierda */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 z-10 w-7 h-7 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg hover:bg-black/90 transition-all",
            arrowAlign === "icon" ? "top-[32px] -translate-y-1/2" : "top-1/2 -translate-y-1/2"
          )}
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Flecha derecha */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 z-10 w-7 h-7 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg hover:bg-black/90 transition-all",
            arrowAlign === "icon" ? "top-[32px] -translate-y-1/2" : "top-1/2 -translate-y-1/2"
          )}
          aria-label="Scroll derecha"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Contenido scrollable */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
      >
        {children}
      </div>
    </div>
  );
}

/** Mapa de categoría → ícono Lucide */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "agencias de viaje": Plane,
  "alojamientos": Hotel,
  "bodegas": Wine,
  "gastronomía": UtensilsCrossed,
  "gastronomia": UtensilsCrossed,
  "productos gourmet": ShoppingBag,
  "turismo aventura": Mountain,
  "turismo": Mountain,
  "salud": Stethoscope,
  "belleza": Sparkles,
  "peluquería": Scissors,
  "peluqueria": Scissors,
  "automotor": Car,
  "construcción": Hammer,
  "construccion": Hammer,
  "educación": GraduationCap,
  "educacion": GraduationCap,
  "entretenimiento": Music,
  "deportes": Dumbbell,
  "mascotas": PawPrint,
  "fotografía": Camera,
  "fotografia": Camera,
  "naturaleza": TreePine,
  "comercios": Store,
};

function getCategoryIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase().trim();
  return CATEGORY_ICONS[normalized] || Store;
}

/**
 * FilterBar — Categorías y subcategorías como pills en carrusel horizontal.
 * 
 * Siempre visible debajo del search bar.
 * - Fila 1: Categorías principales con íconos (scrollable)
 * - Fila 2: Subcategorías (solo si la categoría seleccionada tiene hijos)
 */
export default function FilterBar({ categorias, selectedCategoryDocId, onSelectCategory }: FilterBarProps) {
  // Categorías principales (sin parent)
  const mainCategorias = categorias.filter((c) => {
    if (!c.parent) return true;
    if (typeof c.parent === 'object' && !(c.parent as any).documentId) return true;
    return false;
  });

  // Lógica de subcategorías
  const selectedCategory = categorias.find(c => c.documentId === selectedCategoryDocId);
  const activeParentId = selectedCategory?.parent?.documentId || selectedCategory?.documentId;
  const subcategorias = categorias.filter(c => {
    const pId = c.parent?.documentId || (c.parent as any)?.data?.documentId;
    return pId === activeParentId;
  });
  const showSubcategories = subcategorias.length > 0 && selectedCategoryDocId !== null;

  if (mainCategorias.length === 0) return null;

  return (
    <div className="sticky top-[72px] md:top-[80px] z-40 bg-background/95 backdrop-blur-xl border-b border-white/[0.06] py-2 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-2">
        {/* Fila 1: Categorías principales */}
        <PillCarousel arrowAlign="icon">
          {/* Botón "Todos" */}
          <button
            onClick={() => onSelectCategory(null)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20 group transition-all"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300",
                selectedCategoryDocId === null
                  ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(214,175,55,0.4)]"
                  : "bg-white/5 text-slate-400 border-white/10 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20"
              )}
            >
              <LayoutGrid className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold text-center uppercase tracking-wider truncate block w-full px-1 transition-colors",
                selectedCategoryDocId === null
                  ? "text-primary"
                  : "text-slate-400 group-hover:text-white"
              )}
            >
              Todos
            </span>
          </button>

          {mainCategorias.map((cat) => {
            const isActive = selectedCategoryDocId === cat.documentId ||
              (selectedCategory?.parent?.documentId === cat.documentId);
            const Icon = getCategoryIcon(cat.nombre);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.documentId)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20 group transition-all"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300",
                    isActive
                      ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(214,175,55,0.4)]"
                      : "bg-white/5 text-slate-400 border-white/10 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold text-center uppercase tracking-wider truncate block w-full px-1 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-white"
                  )}
                >
                  {cat.nombre}
                </span>
              </button>
            );
          })}
        </PillCarousel>

        {/* Fila 2: Subcategorías (solo cuando aplica) */}
        {showSubcategories && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <PillCarousel>
              {/* Botón "Todas" para ver todo dentro de la categoría padre */}
              <button
                onClick={() => onSelectCategory(activeParentId!)}
                className={cn(
                  "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border",
                  selectedCategoryDocId === activeParentId
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/5 hover:text-slate-300"
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
                      "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border",
                      isSubActive
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/5 hover:text-slate-300"
                    )}
                  >
                    {sub.nombre}
                  </button>
                );
              })}
            </PillCarousel>
          </motion.div>
        )}
      </div>
    </div>
  );
}
