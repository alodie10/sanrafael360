"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Camera } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { sortGaleriaByOrden } from "@/lib/galeria-order";
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
  const images: { url: string, cropGravity: string, rotation: number }[] = [];
  if (coverUrl) {
    images.push({ 
      url: getStrapiMedia(coverUrl)!, 
      cropGravity: negocio.crop_gravity || "g_auto",
      rotation: 0
    });
  }
  if (isValidPremium && negocio.galeria && negocio.galeria.length > 0) {
    sortGaleriaByOrden(negocio.galeria, negocio.galeria_config).forEach((img: any) => {
      if (img.url) {
        // Excluir videos — los videos se muestran en BusinessGallery
        const isVideo = img.mime?.startsWith('video/') || img.url.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
        if (isVideo) return;
        
        // Excluir imágenes marcadas como internas
        const configStr = negocio.galeria_config?.[img.id];
        let cropGravity = negocio.crop_gravity || "g_auto";
        let isInternal = false;
        let rotation = 0;
        
        if (typeof configStr === 'string') {
           cropGravity = configStr;
        } else if (configStr) {
           cropGravity = configStr.cropGravity || cropGravity;
           isInternal = configStr.isInternal === true;
           rotation = configStr.rotation || 0;
        }

        if (isInternal) return;

        const url = getStrapiMedia(img.url)!;
        if (!images.find(i => i.url === url)) {
          images.push({ url, cropGravity, rotation });
        }
      }
    });
  }

  const hasCarousel = images.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Intervalo temporizado de 4 segundos
  useEffect(() => {
    if (!hasCarousel || isPaused) return;

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
  }, [hasCarousel, images.length, isPaused]);

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
    <section className="select-none">
      {/* ═══════════ ZONA 1: Carrusel de fotos (brillo completo) ═══════════ */}
      <div 
        className="relative w-full overflow-hidden bg-slate-900 h-[min(36dvh,300px)] md:h-[min(42dvh,480px)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Imágenes del carrusel — brillo completo, sin oscurecer */}
        {images.length > 0 ? (
          images.map(({ url: imgUrl, cropGravity, rotation }, index) => {
            const rotPrefix = rotation > 0 ? `a_${rotation}/` : '';
            return (
            <motion.div
              key={imgUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === activeIndex ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: index === activeIndex ? 1 : 0 }}
            >
              <picture>
                {/* Celular: 4:3 (el banner ~300px de alto queda muy cerca de esa proporción) */}
                <source 
                  media="(max-width: 767px)" 
                  srcSet={optimizeCloudinaryUrl(imgUrl, `${rotPrefix}c_fill,ar_4:3,${cropGravity},w_1200,f_auto,q_auto`)} 
                />
                {/* PC: 16:9; el banner se capa a 480px para que el título quede a la vista */}
                <source 
                  media="(min-width: 768px)" 
                  srcSet={optimizeCloudinaryUrl(imgUrl, `${rotPrefix}c_fill,ar_16:9,${cropGravity},w_1920,f_auto,q_auto`)} 
                />
                <img
                  src={optimizeCloudinaryUrl(imgUrl, `${rotPrefix}c_fill,ar_16:9,${cropGravity},w_1920,f_auto,q_auto`)}
                  alt={`${negocio.nombre} - Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </picture>
            </motion.div>
            );
          })
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}

        {/* Gradiente sutil solo en la base para legibilidad de las barras */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent z-10" />

        {/* Zonas táctiles invisibles para navegar */}
        {hasCarousel && (
          <div className="absolute inset-0 z-20 flex">
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

        {/* Barras de progreso estilo Stories (abajo del carrusel) */}
        {hasCarousel && (
          <div className="absolute bottom-3 left-0 right-0 px-4 md:px-8 z-30 flex gap-1.5 pointer-events-none">
            {images.map((_, index) => (
              <div key={index} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear rounded-full"
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

        {/* Pill indicador de fotos */}
        {hasCarousel && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold pointer-events-none">
            <Camera className="w-3.5 h-3.5" />
            <span>{images.length} fotos</span>
          </div>
        )}
      </div>

      {/* ═══════════ ZONA 2: Info del negocio (fondo sólido Obsidian) ═══════════ */}
      <div className="relative bg-background px-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 pt-4 md:pt-6 pb-4 md:pb-6">
          {/* Logo — se superpone ligeramente sobre la foto */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 md:w-28 md:h-28 bg-surface backdrop-blur-xl p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-2xl border border-white/10 shrink-0 flex items-center justify-center overflow-hidden -mt-10 md:-mt-16 relative z-10"
          >
            {logoUrl ? (
              <img 
                src={getStrapiMedia(logoUrl)!} 
                alt={negocio.nombre} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-black font-bold text-2xl md:text-4xl">
                {negocio.nombre.charAt(0)}
              </div>
            )}
          </motion.div>

          {/* Nombre + Badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-5xl md:text-4xl font-heading font-extrabold text-white mb-2 tracking-tight text-balance leading-tight">
              {negocio.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Rating Stars */}
              {(() => {
                const srCount = negocio.review_count || 0;
                const gCount = negocio.google_review_count || 0;
                const tCount = negocio.tripadvisor_review_count || 0;
                const displayCount = srCount + gCount + tCount;

                let averageRating = 0;
                if (displayCount > 0) {
                  const srTotal = srCount * (negocio.rating || 0);
                  const gTotal = gCount * (negocio.google_rating || 0);
                  const tTotal = tCount * (negocio.tripadvisor_rating || 0);
                  averageRating = (srTotal + gTotal + tTotal) / displayCount;
                }
                const roundedRating = Math.round(averageRating);
                
                return (
                  <div className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full border border-white/10">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-3 h-3", s <= roundedRating ? "fill-primary text-primary" : "text-white/10")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {displayCount > 0 ? `${displayCount} Opiniones` : "Sin reseñas"}
                    </span>
                  </div>
                );
              })()}

              {businessStatus && (
                <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", businessStatus.color)}>
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
                      <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 border border-white/15 text-slate-300">
                        {negocio.categoria.nombre}
                      </div>
                    )}
                    {negocio.atributos && negocio.atributos.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {(categoriaYaCubierta ? negocio.atributos : atributosFiltrados).map((attr) => (
                          <div key={attr.documentId} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
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

