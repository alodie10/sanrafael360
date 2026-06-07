"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";

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

  // Filtrar solo videos de la galería
  const videos = galeria.filter((media: any) => {
    const url = getStrapiMedia(media.url);
    if (!url) return false;
    return media.mime?.startsWith('video/') || url.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
  });

  // Si no hay videos ni youtube, no renderizar la sección
  if (videos.length === 0 && !negocio.youtube_url) return null;

  return <VideoGallery videos={videos} youtubeUrl={negocio.youtube_url} businessName={negocio.nombre} />;
}

/** Componente interno para manejar hooks (evitar early returns antes de hooks) */
function VideoGallery({ videos, youtubeUrl, businessName }: { videos: any[]; youtubeUrl?: string; businessName: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

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

  const openFullscreen = (url: string) => {
    setActiveVideoUrl(url);
  };

  const closeFullscreen = () => {
    setActiveVideoUrl(null);
  };

  // Extraer ID de YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!activeVideoUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeVideoUrl]);

  return (
    <>
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-3 italic">
          <Play className="w-5 h-5 text-primary fill-primary" />
          Videos del <span className="text-primary">negocio</span>
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

            {videos.map((video: any, i: number) => {
              const url = getStrapiMedia(video.url);
              if (!url) return null;
              return (
                <motion.button
                  key={video.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openFullscreen(url)}
                  className="relative flex-shrink-0 w-28 h-28 md:w-36 md:h-36 snap-start rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group/thumb cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {/* Poster del video como thumbnail */}
                  <video
                    src={url}
                    className="w-full h-full object-cover pointer-events-none"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  {/* Overlay con icono Play */}
                  <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-5 h-5 md:w-6 md:h-6 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Fullscreen para reproducir video */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={closeFullscreen}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar video"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video player */}
            <motion.video
              ref={fullscreenVideoRef}
              key={activeVideoUrl}
              src={activeVideoUrl}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full max-h-screen object-contain"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
