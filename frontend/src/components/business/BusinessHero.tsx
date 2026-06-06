"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Camera } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";

interface BusinessHeroProps {
  negocio: Negocio;
  businessStatus: { status: string; color: string } | null;
}

export default function BusinessHero({ negocio, businessStatus }: BusinessHeroProps) {
  const logoUrl = negocio.logo?.url;
  const coverUrl = negocio.imagen_portada?.url;

  // Verificar si el comercio es premium y su validez
  let isValidPremium = negocio.is_premium || false;
  if (isValidPremium && negocio.premium_valid_until && new Date() > new Date(negocio.premium_valid_until)) {
    isValidPremium = false;
  }

  // Armar lista de imágenes: Portada + Galería (si es premium)
  const images: string[] = [];
  if (coverUrl) {
    images.push(getStrapiMedia(coverUrl)!);
  }
  if (isValidPremium && negocio.galeria && negocio.galeria.length > 0) {
    negocio.galeria.forEach((img) => {
      if (img.url) {
        const url = getStrapiMedia(img.url)!;
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    });
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Intervalo temporizado de 4 segundos
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const intervalDuration = 4000; // 4s
    const updateInterval = 50; // 50ms
    const increment = (updateInterval / intervalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((curr) => (curr + 1) % images.length);
          return 0;
        }
        return prev + increment;
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [images.length, isPaused]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setActiveIndex((curr) => (curr + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setActiveIndex((curr) => (curr - 1 + images.length) % images.length);
  };

  return (
    <section 
      className="relative overflow-hidden group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Barras de progreso estilo Instagram Stories (Arriba) */}
      {images.length > 1 && (
        <div className="absolute top-4 left-0 right-0 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto z-20 flex gap-1.5 pointer-events-none">
          {images.map((_, index) => (
            <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-primary transition-all ease-linear"
                style={{ 
                   width: index === activeIndex 
                     ? `${progress}%` 
                     : index < activeIndex 
                       ? "100%" 
                       : "0%",
                   transitionDuration: index === activeIndex ? "50ms" : "0ms"
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Background / Carrusel con transiciones */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        {images.length > 0 ? (
          images.map((imgUrl, index) => (
            <motion.img
              key={imgUrl}
              src={imgUrl}
              alt={`${negocio.nombre} - Foto ${index + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === activeIndex ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover brightness-50"
              style={{ zIndex: index === activeIndex ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/40 z-10" />

        {/* Zonas táctiles invisibles para navegar */}
        {images.length > 1 && (
          <div className="absolute inset-0 z-20 flex pointer-events-auto">
            <div 
              onClick={handlePrev}
              className="w-[30%] h-full cursor-pointer"
              title="Imagen anterior"
            />
            <div 
              onClick={handleNext}
              className="w-[70%] h-full cursor-pointer"
              title="Siguiente imagen"
            />
          </div>
        )}
      </div>

      {/* Pill indicador de fotos */}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-12 lg:right-16 z-20 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold border border-white/10 shadow-lg pointer-events-none">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span>{activeIndex + 1} / {images.length}</span>
        </div>
      )}

      <div className="relative flex flex-col justify-end min-h-[340px] md:min-h-[560px] pb-6 md:pb-16 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto z-30 pointer-events-none">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10 pointer-events-auto">
          {/* Logo */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-20 h-20 md:w-44 md:h-44 bg-slate-900/80 backdrop-blur-xl p-2 md:p-3 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-white/10 shrink-0 flex items-center justify-center overflow-hidden"
          >
            {logoUrl ? (
              <img 
                src={getStrapiMedia(logoUrl)!} 
                alt={negocio.nombre} 
                className="w-full h-full object-contain"
              />
            ) : (
               <div className="w-full h-full bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-black font-bold text-4xl">
                  {negocio.nombre.charAt(0)}
               </div>
            )}
          </motion.div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-6xl font-heading font-extrabold text-white mb-2 md:mb-4 tracking-tight text-balance">
              {negocio.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              {/* Rating Stars Header */}
              <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                 <div className="flex items-center gap-0.5">
                   {[1, 2, 3, 4, 5].map((s) => (
                     <Star key={s} className={cn("w-3.5 h-3.5", s <= (negocio.rating || 0) ? "fill-primary text-primary" : "text-white/10")} />
                   ))}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                   {negocio.review_count || 0} Opiniones
                 </span>
              </div>

              {businessStatus && (
                 <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", businessStatus.color)}>
                   {businessStatus.status}
                 </div>
              )}

              {(() => {
                // Deduplicar: si algún atributo ya cubre la categoría, no mostrar categoría por separado
                const categoriaNombre = negocio.categoria?.nombre?.toLowerCase().trim();
                const atributosFiltrados = (negocio.atributos || []).filter(
                  (attr) => attr.nombre?.toLowerCase().trim() !== categoriaNombre
                );
                const categoriaYaCubierta = atributosFiltrados.length < (negocio.atributos || []).length;

                return (
                  <>
                    {negocio.categoria && !categoriaYaCubierta && (
                      <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 border border-white/30 text-white">
                        {negocio.categoria.nombre}
                      </div>
                    )}
                    {negocio.atributos && negocio.atributos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {/* Si la categoría ya está cubierta, mostramos todos los atributos. Si no, los filtrados */}
                        {(categoriaYaCubierta ? negocio.atributos : atributosFiltrados).map((attr) => (
                          <div key={attr.documentId} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-slate-200">
                            {attr.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
