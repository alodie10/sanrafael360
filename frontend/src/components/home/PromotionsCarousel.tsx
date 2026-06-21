"use client";

import { motion } from "framer-motion";
import { Negocio } from "@/types/strapi";
import { getStrapiMedia } from "@/lib/strapi";
import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PromotionsCarouselProps {
  promociones: Negocio[];
}

export default function PromotionsCarousel({ promociones }: PromotionsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!promociones || promociones.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-6 col-span-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold text-white">Promociones Destacadas</h2>
        <div className="flex gap-2 hidden md:flex">
          <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {promociones.map((promo, index) => (
          <Link key={promo.id} href={`/negocios/${promo.slug || promo.documentId}`} className="snap-start shrink-0">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative w-[280px] h-[160px] md:w-[320px] md:h-[180px] rounded-2xl overflow-hidden group cursor-pointer border border-white/10"
            >
              {promo.promocion_flyer?.url ? (
                <img 
                  src={getStrapiMedia(promo.promocion_flyer.url)!} 
                  alt={promo.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : promo.imagen_portada?.url ? (
                <img 
                  src={getStrapiMedia(promo.imagen_portada.url)!} 
                  alt={promo.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <span className="text-primary font-bold text-xs uppercase tracking-wider mb-1">OFERTA ESPECIAL</span>
                <h3 className="text-white font-bold text-lg line-clamp-1">{promo.nombre}</h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
