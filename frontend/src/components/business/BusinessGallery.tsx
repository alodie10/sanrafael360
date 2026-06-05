"use client";

import { motion } from "framer-motion";
import { getStrapiMedia } from "@/lib/strapi";

interface BusinessGalleryProps {
  negocio: any;
  isValidPremium: boolean;
}

const MediaRenderer = ({ media, alt, className }: { media: any, alt: string, className?: string }) => {
  const url = getStrapiMedia(media.url);
  if (!url) return null;
  const isVideo = media.mime?.startsWith('video/') || url.match(/\.(mp4|m4v|webm|ogg|mov)$/i);
  
  if (isVideo) {
    return (
      <video 
        src={url}
        className={className}
        controls
        playsInline
        preload="metadata"
      />
    );
  }
  return <img src={url} alt={alt} className={className} />;
};

export default function BusinessGallery({ negocio, isValidPremium }: BusinessGalleryProps) {
  // La galería es un beneficio EXCLUSIVO Premium
  if (!isValidPremium || !negocio.galeria || negocio.galeria.length === 0) return null;

  return (
    <div className="space-y-8 mb-16">
      <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3 italic">
        Galería de <span className="text-primary">Fotos</span>
        <div className="h-px flex-1 bg-white/5" />
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Imagen Principal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-900"
        >
          <MediaRenderer 
            media={negocio.galeria[0]}
            alt={negocio.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </motion.div>

        {/* Imágenes Secundarias (Grid de 2) */}
        <div className="grid grid-rows-2 gap-4">
          {negocio.galeria.slice(1, 3).map((img: any, i: number) => (
            <motion.div 
              key={img.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="aspect-[4/3] md:aspect-auto rounded-3xl overflow-hidden shadow-xl border border-white/5 bg-slate-900"
            >
              <MediaRenderer 
                media={img}
                alt={`${negocio.nombre} ${i}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grid de miniaturas (si hay más de 3) */}
      {negocio.galeria.length > 3 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {negocio.galeria.slice(3, 7).map((img: any, i: number) => (
            <motion.div 
              key={img.id}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-slate-900"
            >
              <MediaRenderer 
                media={img}
                alt={`${negocio.nombre} ${i + 3}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
