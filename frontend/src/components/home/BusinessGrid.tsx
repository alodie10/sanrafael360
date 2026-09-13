"use client";

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

import { useFavorites } from "@/context/FavoritesContext";
import { uniqueNegocios } from "@/lib/unique-negocios";
import { showsPublicFicha } from "@/lib/search-match";
import DirectoryListingCard from "./DirectoryListingCard";
import styles from "./BusinessGrid.module.css";

export default function BusinessGrid({ negocios, loading = false, onClearFilters, filterFavorites = false, emptyMessage }: BusinessGridProps) {
  const { isFavorite } = useFavorites();
  const [visibleCount, setVisibleCount] = useState(16);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filtrar si estamos en la página de favoritos para ocultar los removidos inmediatamente
  const displayNegocios = uniqueNegocios(
    (filterFavorites
      ? negocios.filter(n => isFavorite(n.documentId))
      : negocios
    ).filter((n) => !removedIds.includes(n.documentId))
  );

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
  const premiumNegocios = visibleNegocios.filter((n) => showsPublicFicha(n));
  const directoryNegocios = visibleNegocios.filter((n) => !showsPublicFicha(n));
  const promociones = premiumNegocios.filter((n) => n.promocion_activa);
  const topNegocios = premiumNegocios.slice(0, 4);
  const restNegocios = premiumNegocios.slice(4);

  return (
    <>
      {premiumNegocios.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {topNegocios.map((negocio, index) => (
        <BusinessCard 
          key={negocio.documentId || `top-${index}`} 
          negocio={negocio} 
          index={index}
          priority={index < 6}
          onDeleted={(documentId) => setRemovedIds((ids) => [...ids, documentId])}
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
          priority={index + 4 < 6}
          onDeleted={(documentId) => setRemovedIds((ids) => [...ids, documentId])}
        />
      ))}
    </div>
      ) : null}

      {directoryNegocios.length > 0 ? (
        <section className={styles.directory} data-testid="directory-listings">
          <div className={styles.directoryHead}>
            <p className={styles.kicker}>Directorio</p>
            <h2 className={styles.title}>Nombre y rubro</h2>
          </div>
          <div className={styles.directoryGrid}>
            {directoryNegocios.map((negocio) => (
              <DirectoryListingCard
                key={negocio.documentId || negocio.slug}
                negocio={negocio}
                onDeleted={(documentId) => setRemovedIds((ids) => [...ids, documentId])}
              />
            ))}
          </div>
        </section>
      ) : null}
      
      {/* Elemento invisible para disparar el IntersectionObserver */}
      {visibleCount < displayNegocios.length && (
        <div ref={observerTarget} className="w-full h-10 mt-8" />
      )}
    </>
  );
}
