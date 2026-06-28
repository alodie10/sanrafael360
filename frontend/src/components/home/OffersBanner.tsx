"use client";

import { useState, useEffect } from "react";
import { Tag, X } from "lucide-react";
import Link from "next/link";
import { fetchFromStrapi } from "@/lib/strapi";

export default function OffersBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("offers_banner_dismissed");
    if (dismissed) return;

    const fetchCount = async () => {
      try {
        // Traemos todas las ofertas activas con su negocio para deduplicar
        const res = await fetchFromStrapi(
          "ofertas?filters[activa][$eq]=true&status=published&populate[negocio][fields][0]=documentId&pagination[pageSize]=100"
        );
        const ofertas = res.data || [];
        // Contamos negocios únicos (un negocio puede tener varias ofertas)
        const negociosUnicos = new Set(
          ofertas
            .map((o: any) => o.negocio?.documentId)
            .filter(Boolean)
        ).size;
        if (negociosUnicos > 0) {
          setOffersCount(negociosUnicos);
          setIsVisible(true);
        }
      } catch (e) {
        // Silenciamos el error para no levantar el overlay de Next.js en desarrollo
        // si el usuario aún no configuró los permisos en Strapi.
      }
    };
    fetchCount();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("offers_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#FFBF00] text-black px-4 py-2.5 flex items-center justify-center relative shadow-md z-40">
      <Link href="/ofertas" className="flex items-center justify-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider hover:opacity-80 transition-opacity w-full max-w-7xl mx-auto px-6">
        <Tag className="w-4 h-4 fill-black/20 shrink-0" />
        <span className="truncate">
        {offersCount > 0 
          ? `${offersCount} negocio${offersCount !== 1 ? 's' : ''} con ofertas activas → Ver ofertas`
          : `Descubrí las ofertas activas esta semana → Ver ofertas`
        }
        </span>
      </Link>
      <button 
        onClick={handleDismiss}
        className="absolute right-4 p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
        aria-label="Cerrar banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
