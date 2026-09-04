"use client";

import BusinessCard from "@/components/home/BusinessCard";
import OfferCard from "@/components/business/OfferCard";
import type { EfemeridePublicItem } from "@/types/strapi";

export default function EfemeridePublicGrid({ items }: { items: EfemeridePublicItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-24 px-6 bg-slate-900/20 rounded-[3rem] border border-white/5">
        <div className="text-5xl mb-6 opacity-30">🎉</div>
        <h3 className="text-xl font-bold text-white mb-2">Todavía no hay participantes</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          Esta efeméride está activa, pero aún no se cargaron negocios.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item, index) => {
        if (item.kind === "oferta" && item.oferta) {
          return (
            <OfferCard
              key={item.oferta.documentId || `oferta-${index}`}
              oferta={item.oferta}
              index={index}
            />
          );
        }
        return (
          <BusinessCard
            key={item.negocio.documentId || `negocio-${index}`}
            negocio={item.negocio}
            index={index}
            priority={index < 4}
          />
        );
      })}
    </div>
  );
}
