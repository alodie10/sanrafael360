"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
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

  return (
    <section className="relative overflow-hidden">
      {/* Background: imagen de portada */}
      <div className="absolute inset-0">
        {coverUrl ? (
          <img 
            src={getStrapiMedia(coverUrl)!} 
            alt={negocio.nombre}
            className="w-full h-full object-cover brightness-50"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/40" />
      </div>

      <div className="relative flex flex-col justify-end min-h-[340px] md:min-h-[560px] pb-6 md:pb-16 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10">
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

              {negocio.categoria && (
                 <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 border border-white/30 text-white">
                   {negocio.categoria.nombre}
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
