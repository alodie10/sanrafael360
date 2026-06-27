"use client";

import { Oferta } from "@/types/strapi";
import { Tag } from "lucide-react";

export default function OfferModule({ ofertas }: { ofertas?: Oferta[] }) {
  const activeOffer = ofertas?.find(o => o.activa);
  
  if (!activeOffer) return null;

  // Simple date format without date-fns to avoid dependency issues if not installed
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-AR", { day: 'numeric', month: 'long' });
    } catch {
      return "";
    }
  };

  const formattedDate = activeOffer.valida_hasta ? formatDate(activeOffer.valida_hasta) : "";

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 border-l-4 border-l-[#FFBF00] p-4 rounded-r-2xl rounded-l-md shadow-lg mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[#FFBF00] font-bold text-xs uppercase tracking-wider">
        <Tag className="w-4 h-4 fill-[#FFBF00]/20" />
        <span>Oferta Activa {formattedDate && `· Válida hasta el ${formattedDate}`}</span>
      </div>
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h4 className="text-white font-bold text-lg leading-tight">{activeOffer.titulo}</h4>
          {activeOffer.descripcion && (
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">{activeOffer.descripcion}</p>
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
