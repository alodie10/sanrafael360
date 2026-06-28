"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import BusinessCard from "./BusinessCard";
import BusinessCardSkeleton from "./BusinessCardSkeleton";
import PromotionsCarousel from "./PromotionsCarousel";
import { Negocio } from "@/types/strapi";

interface BusinessGridProps {
  negocios: Negocio[];
  loading?: boolean;
  onClearFilters?: () => void;
  filterFavorites?: boolean;
  emptyMessage?: string;
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

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

import { useFavorites } from "@/context/FavoritesContext";

export default function BusinessGrid({ negocios, loading = false, onClearFilters, filterFavorites = false, emptyMessage }: BusinessGridProps) {
  const { isFavorite } = useFavorites();
  const [visibleCount, setVisibleCount] = useState(16);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filtrar si estamos en la página de favoritos para ocultar los removidos inmediatamente
  const displayNegocios = filterFavorites 
    ? negocios.filter(n => isFavorite(n.documentId))
    : negocios;

  // Reseteamos el conteo si cambia la longitud de la lista filtrada (ej. al buscar)
  useEffect(() => {
    setVisibleCount(16);
  }, [displayNegocios.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < displayNegocios.length) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, displayNegocios.length]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {[...Array(10)].map((_, i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    );
  }



  if (displayNegocios.length === 0) {
    return (
      <div className="text-center py-24 px-6 bg-slate-900/20 rounded-[3rem] border border-white/5 backdrop-blur-sm">
        <div className="text-5xl mb-6 opacity-30">🏔️</div>
        <h3 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h3>
        <p className="text-slate-400 max-w-sm mx-auto mb-8">Prueba ajustando tus filtros o vuelve a intentarlo con otros términos.</p>
        
        {onClearFilters && (
          <button 
            onClick={onClearFilters}
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
          >
            Limpiar búsqueda y filtros
          </button>
        )}
      </div>
    );
  }

  const visibleNegocios = displayNegocios.slice(0, visibleCount);
  const promociones = visibleNegocios.filter(n => n.promocion_activa);
  
  // Dividimos la grilla para intercalar el carrusel
  const topNegocios = visibleNegocios.slice(0, 4);
  const restNegocios = visibleNegocios.slice(4);

  return (
    <>
      <motion.div 
        variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
    >
      {topNegocios.map((negocio, index) => (
        <BusinessCard 
          key={negocio.documentId || `top-${index}`} 
          negocio={negocio} 
          index={index} 
        />
      ))}
      
      {promociones.length > 0 && (
        <PromotionsCarousel promociones={promociones} />
      )}

      {restNegocios.map((negocio, index) => (
        <BusinessCard 
          key={negocio.documentId || `rest-${index}`} 
          negocio={negocio} 
          index={index + 4} 
        />
      ))}
    </motion.div>
      
      {/* Elemento invisible para disparar el IntersectionObserver */}
      {visibleCount < displayNegocios.length && (
        <div ref={observerTarget} className="w-full h-10 mt-8" />
      )}
    </>
  );
}
