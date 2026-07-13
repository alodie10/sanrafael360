"use client";

import { motion } from "framer-motion";
import { Star, Check, Heart, Settings, Crown, Tag } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useState } from "react";

const FavoritesModal = dynamic(() => import('../auth/FavoritesModal'), { ssr: false });
import { toast } from "sonner";
import { useFavorites } from "@/context/FavoritesContext";

interface BusinessCardProps {
  negocio: Negocio;
  index?: number;
}

export default function BusinessCard({ negocio, index = 0 }: BusinessCardProps) {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const coverUrl = negocio.imagen_portada?.url;
  const businessSlug = negocio.slug || negocio.documentId;
  const businessId = negocio.documentId;

  const sessionUserId = String(session?.user?.id || "");
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  
  const isAdmin = session?.user?.role === 'Admin';
  const isOwner = sessionUserId && ownerId && sessionUserId === ownerId;
  const canManage = isAdmin || isOwner;
  
  let isValidPremium = negocio.is_premium;
  if (isValidPremium && negocio.premium_valid_until) {
    if (new Date() > new Date(negocio.premium_valid_until)) {
      isValidPremium = false;
    }
  }

  const isFav = isFavorite(businessId);

  // Calcular rating usando los campos precalculados de Strapi
  let displayCount = negocio.review_count || 0;
  let averageRating = negocio.rating || 0;
  
  // Fallback a Google/TripAdvisor si no hay reseñas nativas
  if (displayCount === 0) {
    if (negocio.google_review_count && negocio.google_review_count > 0) {
      displayCount = negocio.google_review_count;
      averageRating = negocio.google_rating || 0;
    } else if (negocio.tripadvisor_review_count && negocio.tripadvisor_review_count > 0) {
      displayCount = negocio.tripadvisor_review_count;
      averageRating = negocio.tripadvisor_rating || 0;
    }
  }

  return (
    <div className="relative z-0 isolate h-full group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true }}
        className="relative z-0 isolate flex flex-col gap-3 w-full h-full"
      >
        {/* Portada Cuadrada (1:1) — acciones dentro para que overflow-hidden las recorte al scroll */}
        <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-slate-800">
          {coverUrl ? (
            <>
              <motion.div className="w-full h-full relative transition-transform duration-1000 group-hover:scale-110 opacity-70">
                <Image
                  src={getStrapiMedia(coverUrl)!}
                  alt={negocio.nombre}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/20 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-4xl opacity-20 filter grayscale">🏝️</span>
            </div>
          )}

          <Link
            href={`/negocios/${businessSlug}`}
            className="absolute inset-0 z-10 rounded-[1.5rem]"
            aria-label={`Ver ${negocio.nombre}`}
          />

          {/* Badges Overlay (Atributos Destacados & Oferta) */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-20 pointer-events-none">
            {negocio.ofertas && negocio.ofertas.some(o => o.activa) && (
              <div className="px-3 py-1 bg-[#FFBF00] rounded-full text-[10px] font-bold text-black shadow-lg flex items-center gap-1 uppercase tracking-widest">
                <Tag className="w-3 h-3" />
                {(() => {
                  const activeOffer = negocio.ofertas.find(o => o.activa);
                  if (activeOffer?.tipo_oferta === "Promocion2x1") return "2X1";
                  if (activeOffer?.tipo_oferta === "Regalo") return "REGALO";
                  if (activeOffer?.tipo_oferta === "Especial") return "ESPECIAL";
                  if (activeOffer?.tipo_oferta === "Experiencia") return "EXPERIENCIA";
                  if (activeOffer?.porcentaje_descuento) return `-${activeOffer.porcentaje_descuento}%`;
                  return 'OFERTA';
                })()}
              </div>
            )}
            {negocio.atributos && negocio.atributos.length > 0 && negocio.atributos.slice(0, 2).map((attr: any) => (
              <div key={attr.id || attr.nombre} className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20 uppercase tracking-widest shadow-lg">
                {attr.nombre}
              </div>
            ))}
          </div>

          {/* Acciones (corazón, premium, gestionar) — recortadas por overflow-hidden */}
          <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-3">
            {/* Heart / Favorito */}
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 hover:scale-110 active:scale-95 transition-all drop-shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!session) {
                  setShowLoginModal(true);
                } else {
                  toggleFavorite(businessId);
                }
              }}
            >
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors",
                  isFav 
                    ? "fill-red-500 text-red-500 stroke-red-500" 
                    : "text-white fill-black/40 stroke-white stroke-[2]"
                )} 
              />
            </button>

            {/* Corona Premium */}
            {isValidPremium && (
              <div 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-amber-500/30 drop-shadow-lg"
                title="Socio Premium"
              >
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              </div>
            )}

            {/* Gestionar */}
            {canManage && (
              <Link 
                href={`/portal/negocios/${businessSlug}/editar`}
                className="w-10 h-10 bg-primary/90 text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-black/10"
                title="Gestionar negocio"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Información (fuera de la foto) — también clickeable */}
        <Link href={`/negocios/${businessSlug}`} className="flex flex-col gap-1 px-1 relative z-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-base font-bold text-white pr-2">
              {negocio.nombre}
            </h3>
            
            {displayCount === 0 ? (
              <div className="flex items-center mt-0.5 opacity-80 shrink-0">
                <span className="text-xs font-semibold text-white uppercase tracking-widest">
                  Nuevo
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-white">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-white/50 ml-1">({displayCount})</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            {negocio.price_range ? (
              <span className="font-medium text-white/70">
                {negocio.price_range === 'low' && '$'}
                {negocio.price_range === 'medium' && '$$'}
                {negocio.price_range === 'high' && '$$$'}
                {negocio.price_range === 'luxury' && '$$$$'}
              </span>
            ) : (
              <span className="font-medium text-white/30">$</span>
            )}
          </div>
        </Link>
      </motion.div>

      {/* Login Modal para Favoritos */}
      {showLoginModal && (
        <div className="relative z-50">
          <FavoritesModal isOpen={true} onClose={() => setShowLoginModal(false)} />
        </div>
      )}
    </div>
  );
}