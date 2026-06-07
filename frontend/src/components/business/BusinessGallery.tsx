"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
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
 * Si no hay videos en la galería, la sección se oculta completamente.
 */
export default function BusinessGallery({ negocio, isValidPremium }: BusinessGalleryProps) {
  // La galería es un beneficio EXCLUSIVO Premium
  if (!isValidPremium || !negocio.galeria || negocio.galeria.length === 0) return null;

  // Filtrar solo videos de la galería
  const videos = negocio.galeria.filter((media: any) => {
    const url = getStrapiMedia(media.url);
    if (!url) return false;
    return media.mime?.startsWith('video/') || url.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
  });

  // Si no hay videos, no renderizar la sección
  if (videos.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-3 italic">
        <Play className="w-5 h-5 text-primary fill-primary" />
        Videos del <span className="text-primary">negocio</span>
        <div className="h-px flex-1 bg-white/5" />
      </h2>

      {/* Carrusel horizontal de videos */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {videos.map((video: any, i: number) => {
          const url = getStrapiMedia(video.url);
          if (!url) return null;
          return (
            <motion.div
              key={video.id || i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-[85%] md:w-[48%] snap-start rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-slate-900"
            >
              <video
                src={url}
                className="w-full aspect-video object-cover"
                controls
                playsInline
                preload="metadata"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

