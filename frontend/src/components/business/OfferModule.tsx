"use client";

import { Oferta } from "@/types/strapi";
import { formatCalendarDate } from "@/lib/calendar-date";
import { Tag } from "lucide-react";

export default function OfferModule({ ofertas }: { ofertas?: Oferta[] }) {
  const activeOffer = ofertas?.find(o => o.activa);
  
  if (!activeOffer) return null;

  const formattedDate = activeOffer.valida_hasta
    ? formatCalendarDate(activeOffer.valida_hasta, { day: "numeric", month: "long" })
    : "";

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 border-l-4 border-l-[#FFBF00] p-4 rounded-r-2xl rounded-l-md shadow-lg mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[#FFBF00] font-bold text-xs uppercase tracking-wider">
        <Tag className="w-4 h-4 fill-[#FFBF00]/20" />
        <span>Oferta Activa {formattedDate && `· Válida hasta el ${formattedDate}`}</span>
      </div>
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-lg leading-tight break-words">{activeOffer.titulo}</h4>
          {activeOffer.descripcion && (
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
              {activeOffer.descripcion}
            </p>
          )}
        </div>
        
        {(activeOffer.precio_original || activeOffer.precio_descuento) && (
          <div className="text-right shrink-0 bg-white/5 p-2 rounded-xl">
             {activeOffer.precio_original && (
               <span className="block text-slate-400 line-through text-xs mb-0.5">
                 ${activeOffer.precio_original.toLocaleString("es-AR")}
               </span>
             )}
             {activeOffer.precio_descuento && (
               <span className="block text-[#FFBF00] font-black text-xl">
                 ${activeOffer.precio_descuento.toLocaleString("es-AR")}
               </span>
             )}
          </div>
        )}
      </div>

      {activeOffer.condiciones && (
        <div className="mt-1 text-xs text-slate-500 italic bg-white/5 p-2 rounded-md">
          * {activeOffer.condiciones}
        </div>
      )}
    </div>
  );
}
