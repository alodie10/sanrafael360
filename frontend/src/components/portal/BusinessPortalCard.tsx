"use client";

import { motion } from "framer-motion";
import { Building2, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStrapiMedia } from "@/lib/strapi";

interface BusinessPortalCardProps {
  negocio: any;
}

export default function BusinessPortalCard({ negocio }: BusinessPortalCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative bg-zinc-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 backdrop-blur-md flex flex-col h-full"
    >
      {/* Glass Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative h-56 bg-zinc-800 overflow-hidden">
        {negocio.imagen_portada ? (
          <img 
            src={getStrapiMedia(negocio.imagen_portada.url) ?? undefined} 
            alt={negocio.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800">
            <Building2 className="w-20 h-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        
        {/* Status Badge Floating */}
        <div className="absolute top-6 right-6 z-10">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl shadow-2xl",
            negocio.estado_reclamo === 'aprobado' 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          )}>
            {negocio.estado_reclamo === 'aprobado' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">En Revisión</span>
              </>
            )}
          </div>
        </div>

        {/* Logo Overlap */}
        <div className="absolute -bottom-6 left-8 w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl p-1 shadow-2xl group-hover:-translate-y-2 transition-transform duration-500">
          {negocio.logo ? (
            <img 
              src={getStrapiMedia(negocio.logo.url) ?? undefined} 
              alt={negocio.nombre}
              className="w-full h-full object-cover rounded-xl bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-black font-serif font-bold text-xl rounded-xl">
              {negocio.nombre.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="p-8 pt-10 flex flex-col flex-1">
        <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-primary transition-colors duration-300">
          {negocio.nombre}
        </h3>
        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-8">
          <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="truncate">{negocio.categoria?.nombre || "General"}</span>
        </div>
        
        <div className="mt-auto grid grid-cols-2 gap-4">
          <Link 
            href={`/negocios/${negocio.slug}`}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
          >
            <ExternalLink className="w-4 h-4" /> Perfil
          </Link>
          <Link 
            href={`/portal/negocios/${negocio.slug}/editar`}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-primary hover:bg-primary/90 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary/10"
          >
            Gestionar
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
