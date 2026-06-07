"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight, Settings, Star, Check } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface BusinessCardProps {
  negocio: Negocio;
  index?: number;
}

export default function BusinessCard({ negocio, index = 0 }: BusinessCardProps) {
  const { data: session } = useSession();
  const logoUrl = negocio.logo?.url;
  const coverUrl = negocio.imagen_portada?.url;
  const businessSlug = negocio.slug || negocio.documentId;

  const sessionUserId = String((session as any)?.user?.id || "");
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  
  const isAdmin = (session as any)?.user?.role === 'Admin';
  const isOwner = sessionUserId && ownerId && sessionUserId === ownerId;
  const canManage = isAdmin || isOwner;
  
  let isValidPremium = negocio.is_premium;
  if (isValidPremium && negocio.premium_valid_until) {
    if (new Date() > new Date(negocio.premium_valid_until)) {
      isValidPremium = false;
    }
  }

  return (
    <div className="relative h-full group">
      {/* Botón de Gestión Rápida Overlay */}
      {canManage && (
        <Link 
          href={`/portal/negocios/${businessSlug}/editar`}
          className="absolute top-4 right-4 z-[30] bg-primary text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border border-black/10"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Gestionar</span>
        </Link>
      )}

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

          {/* Glass Badge Categoría & Premium */}
          <div className="absolute top-6 left-6 flex flex-col items-start gap-2 z-10">
            {negocio.categoria && (
              <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20 uppercase tracking-widest shadow-lg">
                {negocio.categoria.nombre}
              </div>
            )}
            {isValidPremium && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-amber-200 to-amber-500 rounded-full text-[10px] font-black text-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Verificado
              </div>
            )}
          </div>

          {/* Logo Overlap Premium */}
          <div className="absolute -bottom-8 right-8 w-20 h-20 md:w-24 md:h-24 bg-slate-900/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl border border-white/10 group-hover:scale-110 transition-all duration-500 z-10 group-hover:-translate-y-2 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={getStrapiMedia(logoUrl)!}
                alt={negocio.nombre}
                className="w-full h-full object-contain"
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

          <h3 className="text-2xl font-heading font-bold mb-1 text-white group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {negocio.nombre}
          </h3>

          {/* Rating Stars (Yelp Style) */}
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
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-3.5 h-3.5",
                        s <= roundedRating 
                          ? "fill-primary text-primary" 
                          : "fill-white/5 text-white/10"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {displayCount > 0 
                    ? `${displayCount} ${displayCount === 1 ? 'Reseña' : 'Reseñas'}`
                    : "Sin reseñas"}
                </span>
              </div>
            );
          })()}

          <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
            {negocio.descripcion
              ? negocio.descripcion.replace(/<[^>]*>?/gm, "")
              : "Descubre experiencias únicas en el corazón de San Rafael, Mendoza."}
          </p>

          {/* Tags / Atributos */}
          {negocio.atributos && negocio.atributos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {negocio.atributos.slice(0, 3).map((attr) => (
                <span key={attr.documentId} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                  {attr.nombre}
                </span>
              ))}
              {negocio.atributos.length > 3 && (
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  +{negocio.atributos.length - 3}
                </span>
              )}
            </div>
          )}

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

            {/* Rango de Precios (RF-10) */}
            {negocio.price_range && (
              <div className="flex items-center gap-0.5 text-primary/80 font-black text-[10px] bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                {Array.from({ length: 4 }).map((_, i) => {
                  const levels: Record<string, number> = {
                    "Economico": 1,
                    "Moderado": 2,
                    "Medio-Alto": 3,
                    "Alto": 4
                  };
                  const currentLevel = levels[negocio.price_range!] || 1;
                  return (
                    <span key={i} className={cn(i < currentLevel ? "opacity-100" : "opacity-20")}>
                      $
                    </span>
                  );
                })}
              </div>
            )}

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
    </div>
  );
}
