"use client";

import { motion } from "framer-motion";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BusinessCardProps {
  negocio: Negocio;
  index?: number;
}

export default function BusinessCard({ negocio, index = 0 }: BusinessCardProps) {
  const logoUrl = negocio.logo?.url;
  const coverUrl = negocio.imagen_portada?.url;
  const businessSlug = negocio.slug || negocio.documentId;

  return (
    <Link href={`/negocios/${businessSlug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        className="group relative bg-slate-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-2xl backdrop-blur-sm h-full"
      >
        {/* Portada con Zoom */}
        <div className="relative h-64 overflow-hidden">
          {coverUrl ? (
            <>
              <motion.img
                src={getStrapiMedia(coverUrl)!}
                alt={negocio.nombre}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/20" />
            </>
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-4xl opacity-20 filter grayscale">🏝️</span>
            </div>
          )}

          {/* Glass Badge Categoría */}
          {negocio.categoria && (
            <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20 uppercase tracking-widest z-10 shadow-lg">
              {negocio.categoria.nombre}
            </div>
          )}

          {/* Logo Overlap Premium */}
          <div className="absolute -bottom-8 right-8 w-20 h-20 md:w-24 md:h-24 bg-background/90 backdrop-blur-2xl p-1.5 rounded-[2rem] shadow-2xl border border-white/10 group-hover:scale-110 transition-all duration-500 z-10 group-hover:-translate-y-2">
            {logoUrl ? (
              <img
                src={getStrapiMedia(logoUrl)!}
                alt={negocio.nombre}
                className="w-full h-full rounded-[1.7rem] object-cover bg-white"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary rounded-[1.7rem] flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-inner">
                {negocio.nombre.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 pt-12">
          <div className="flex items-center gap-1 text-secondary mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={cn("w-4 h-4 fill-current", i === 4 && "opacity-40")} />
            ))}
          </div>

          <h3 className="text-2xl font-heading font-bold mb-3 text-white group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {negocio.nombre}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-2 mb-8 leading-relaxed">
            {negocio.descripcion
              ? negocio.descripcion.replace(/<[^>]*>?/gm, "")
              : "Descubre experiencias únicas en el corazón de San Rafael, Mendoza."}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <div className="w-6 h-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-primary/70" />
              </div>
              <span className="line-clamp-1 max-w-[150px]">
                {negocio.direccion || "San Rafael"}
              </span>
            </div>

            <motion.div
              whileHover={{ scale: 1.1, rotate: -45 }}
              className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>

        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    </Link>
  );
}
