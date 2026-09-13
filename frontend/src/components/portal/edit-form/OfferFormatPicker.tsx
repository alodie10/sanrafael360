"use client";

import { Check } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import type { FormatoVisualOferta } from "@/lib/oferta-banners";
import type { StrapiMedia } from "@/types/strapi";

type Props = {
  formato: FormatoVisualOferta;
  onFormato: (value: FormatoVisualOferta) => void;
  gallery: StrapiMedia[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  coverId?: number;
};

export default function OfferFormatPicker({
  formato,
  onFormato,
  gallery,
  selectedIds,
  onToggle,
  coverId,
}: Props) {
  return (
    <div className="flex flex-col gap-3" data-testid="oferta-formato">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cómo se muestra</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onFormato("Ficha")}
          className={`rounded-xl px-3 py-3 text-left border transition-colors ${
            formato === "Ficha" ? "border-[#FFBF00] bg-[#FFBF00]/10" : "border-white/10 bg-black/40"
          }`}
        >
          <span className="block text-sm font-bold text-white">Ficha</span>
          <span className="block text-[11px] text-slate-400 mt-1">Título, precio y texto, como ahora.</span>
        </button>
        <button
          type="button"
          onClick={() => onFormato("Banners")}
          className={`rounded-xl px-3 py-3 text-left border transition-colors ${
            formato === "Banners" ? "border-[#FFBF00] bg-[#FFBF00]/10" : "border-white/10 bg-black/40"
          }`}
          data-testid="oferta-formato-banners"
        >
          <span className="block text-sm font-bold text-white">Banners</span>
          <span className="block text-[11px] text-slate-400 mt-1">Carousel con fotos de la galería.</span>
        </button>
      </div>

      {formato === "Banners" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Subí los afiches en Galería. Acá solo marcás cuáles entran al carousel.
          </p>
          {gallery.length === 0 ? (
            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              Todavía no hay fotos en la ficha. Subilas en Galería, guardá el perfil y volvé a esta oferta.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[36vh] overflow-y-auto overscroll-contain pr-1" data-testid="oferta-banner-picker">
              {gallery.map((item) => {
                const selected = selectedIds.includes(item.id);
                const src = getStrapiMedia(item.url);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border ${
                      selected ? "border-[#FFBF00]" : "border-white/10 opacity-70"
                    }`}
                    aria-pressed={selected}
                    aria-label={`Usar imagen ${item.name || item.id}`}
                  >
                    {src && <img src={src} alt="" className="w-full h-full object-cover" />}
                    {item.id === coverId && (
                      <span className="absolute top-1 left-1 text-[9px] font-black uppercase tracking-widest bg-black/70 text-white px-1.5 py-0.5 rounded">
                        Portada
                      </span>
                    )}
                    {selected && (
                      <span className="absolute bottom-1 right-1 p-1 rounded-full bg-[#FFBF00] text-black">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
