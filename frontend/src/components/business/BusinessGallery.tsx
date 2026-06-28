"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";

interface BusinessGalleryProps {
  negocio: any;
  isValidPremium: boolean;
}

/**
 * BusinessGallery — Sección de Videos
 * 
 * Las fotos del negocio se muestran en el carrusel Stories del Hero (BusinessHero).
 * Esta sección queda reservada exclusivamente para videos del negocio.
 * Thumbnails cuadrados con bordes redondeados, flechas de navegación lateral,
 * y reproducción fullscreen al hacer click.
 */
export default function BusinessGallery({ negocio, isValidPremium }: BusinessGalleryProps) {
  // La galería es un beneficio EXCLUSIVO Premium
  if (!isValidPremium) return null;

  const galeria = negocio.galeria || [];

  // Filtrar videos y fotos marcadas como internas
  const mediaItems = galeria.filter((media: any) => {
    const url = getStrapiMedia(media.url);
    if (!url) return false;
    const isVideo = media.mime?.startsWith('video/') || url.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
    if (isVideo) return true;
    
    // Si no es video, verificar si está marcado como interno
    const configStr = negocio.galeria_config?.[media.id];
    let isInternal = false;
    if (configStr && typeof configStr !== 'string') {
       isInternal = configStr.isInternal === true;
    }
    return isInternal;
  });

  // Si no hay media interna ni youtube, no renderizar la sección
  if (mediaItems.length === 0 && !negocio.youtube_url) return null;

  return <MediaGallery items={mediaItems} youtubeUrl={negocio.youtube_url} businessName={negocio.nombre} />;
}

/** Componente interno para manejar hooks (evitar early returns antes de hooks) */
function MediaGallery({ items, youtubeUrl, businessName }: { items: any[]; youtubeUrl?: string; businessName: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const openFullscreen = (index: number) => {
    setActiveIndex(index);
  };

  const closeFullscreen = () => {
    setActiveIndex(null);
  };

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => prev !== null ? (prev + 1) % parsedItems.length : null);
  }, []);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => prev !== null ? (prev - 1 + parsedItems.length) % parsedItems.length : null);
  }, []);

  // Extraer ID de YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

  // Navegar con flechas del teclado
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, nextSlide, prevSlide]);

  const parsedItems = items.map((media: any, i: number) => {
    const originalUrl = getStrapiMedia(media.url);
    if (!originalUrl) return null;
    
    const isVideo = media.mime?.startsWith('video/') || originalUrl.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
    let thumbnailUrl = "";
    let optimizedMediaUrl = "";

    if (isVideo) {
      const urlAsGif = originalUrl.replace(/\.(mp4|mov|webm)$/i, '.gif');
      thumbnailUrl = optimizeCloudinaryUrl(urlAsGif, "f_auto,q_auto,c_fill,w_400,h_400,so_0,du_3");
      optimizedMediaUrl = optimizeCloudinaryUrl(originalUrl, "f_auto,q_auto");
    } else {
      thumbnailUrl = optimizeCloudinaryUrl(originalUrl, "f_auto,q_auto,c_fill,w_400,h_400");
      optimizedMediaUrl = optimizeCloudinaryUrl(originalUrl, "f_auto,q_auto,w_1920"); // max 1920px
    }

    return { id: media.id || i, isVideo, thumbnailUrl, optimizedMediaUrl };
  }).filter(Boolean);

  return (
    <>
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-3 italic">
          <Play className="w-5 h-5 text-primary fill-primary" />
          Multimedia del <span className="text-primary">negocio</span>
          <div className="h-px flex-1 bg-white/5" />
        </h2>

        {/* Contenedor con flechas */}
        <div className="relative group/gallery">
          {/* Flecha izquierda */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg hover:bg-black/80 transition-all opacity-0 group-hover/gallery:opacity-100 -translate-x-1/2"
              aria-label="Videos anteriores"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Flecha derecha */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg hover:bg-black/80 transition-all opacity-0 group-hover/gallery:opacity-100 translate-x-1/2"
              aria-label="Más videos"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Fila de thumbnails */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
          >
            {youtubeId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative flex-shrink-0 w-64 md:w-80 snap-start rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group/thumb"
              >
                <iframe 
                  className="w-full h-full aspect-video"
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </motion.div>
            )}

            {parsedItems.map((item: any, i: number) => {
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openFullscreen(i)}
                  className="relative flex-shrink-0 w-28 h-28 md:w-36 md:h-36 snap-start rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group/thumb cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={`Multimedia ${i+1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {/* Overlay con icono Play (solo videos) */}
                  {item.isVideo && (
                    <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  )}
                  {/* Overlay de hover sutil para imágenes */}
                  {!item.isVideo && (
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Fullscreen para reproducir multimedia */}
      <AnimatePresence>
        {activeIndex !== null && (() => {
          const activeItem = parsedItems[activeIndex];
          if (!activeItem) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4 md:p-12"
              onClick={closeFullscreen}
            >
              {/* Controles: Cerrar */}
              <button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Cerrar multimedia"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Controles: Flechas (solo si hay más de 1 item) */}
              {parsedItems.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-8 h-8 -ml-1" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-8 h-8 -mr-1" />
                  </button>
                </>
              )}

              {/* Media player/viewer */}
              {activeItem.isVideo ? (
                <motion.video
                  ref={fullscreenVideoRef}
                  key={activeItem.optimizedMediaUrl}
                  src={activeItem.optimizedMediaUrl}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full h-full max-h-screen object-contain"
                  controls
                  autoPlay
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <motion.img
                  key={activeItem.optimizedMediaUrl}
                  src={activeItem.optimizedMediaUrl}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full h-full max-h-screen object-contain"
                  alt="Imagen en pantalla completa"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
