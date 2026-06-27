"use client";

import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { Oferta } from "@/types/strapi";
import Link from "next/link";
import Image from "next/image";

export default function OfferCard({ oferta, index = 0 }: { oferta: Oferta, index?: number }) {
  const negocio = oferta.negocio;
  if (!negocio) return null;

  const coverUrl = negocio.imagen_portada?.url || negocio.logo?.url;
  const businessSlug = negocio.slug || negocio.documentId;

  // Simple date format
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-AR", { day: 'numeric', month: 'short' });
    } catch {
      return "";
    }
  };

  const formattedDate = oferta.valida_hasta ? formatDate(oferta.valida_hasta) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative flex flex-col w-full h-full bg-slate-900 rounded-[1.5rem] overflow-hidden border border-white/10 group shadow-xl hover:shadow-2xl hover:shadow-[#FFBF00]/10 transition-all"
    >
      <Link href={`/negocios/${businessSlug}`} className="absolute inset-0 z-10" aria-label={`Ver oferta de ${negocio.nombre}`} />

      {/* Imagen Header */}
      <div className="relative h-48 w-full bg-slate-800">
        {coverUrl ? (
          <Image
            src={getStrapiMedia(coverUrl)!}
            alt={negocio.nombre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <span className="text-4xl opacity-20 filter grayscale">🏝️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />

        {/* Categoria Badge */}
        {negocio.categoria && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
            {negocio.categoria.nombre}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col p-5 flex-1 relative z-20 bg-slate-900">
        <h4 className="text-xl font-bold text-white leading-tight mb-1">{oferta.titulo}</h4>
        <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">En {negocio.nombre}</p>
        
        {oferta.descripcion && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{oferta.descripcion}</p>
        )}

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/10">
          <div>
            {oferta.precio_original && (
              <span className="block text-slate-500 line-through text-xs mb-0.5">
                ${oferta.precio_original.toLocaleString("es-AR")}
              </span>
            )}
            {oferta.precio_descuento && (
              <span className="block text-[#FFBF00] font-black text-2xl">
                ${oferta.precio_descuento.toLocaleString("es-AR")}
              </span>
            )}
          </div>
          
          {oferta.porcentaje_descuento && (
            <div className="bg-[#FFBF00] text-black px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1 shadow-lg shadow-[#FFBF00]/20">
              <Tag className="w-4 h-4" />
              -{oferta.porcentaje_descuento}%
            </div>
          )}
        </div>
      </div>
      
      {/* Válido hasta banner interior */}
      {formattedDate && (
        <div className="bg-[#FFBF00]/10 text-[#FFBF00] text-[10px] font-bold uppercase tracking-widest text-center py-2 px-4 border-t border-[#FFBF00]/20 relative z-20">
          Válido hasta {formattedDate}
        </div>
      )}
    </motion.div>
  );
}
