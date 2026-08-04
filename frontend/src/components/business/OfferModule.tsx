"use client";

import { Oferta } from "@/types/strapi";
import { formatCalendarDate } from "@/lib/calendar-date";
import { Tag } from "lucide-react";

function OfferBlock({ oferta }: { oferta: Oferta }) {
  const formattedDate = oferta.valida_hasta
    ? formatCalendarDate(oferta.valida_hasta, { day: "numeric", month: "long" })
    : "";

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 border-l-4 border-l-[#FFBF00] p-4 rounded-r-2xl rounded-l-md shadow-lg flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[#FFBF00] font-bold text-xs uppercase tracking-wider">
        <Tag className="w-4 h-4 fill-[#FFBF00]/20" />
        <span>Oferta Activa {formattedDate && `· Válida hasta el ${formattedDate}`}</span>
      </div>

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-lg leading-tight break-words">{oferta.titulo}</h4>
          {oferta.descripcion && (
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
              {oferta.descripcion}
            </p>
          )}
        </div>

        {(oferta.precio_original || oferta.precio_descuento) && (
          <div className="text-right shrink-0 bg-white/5 p-2 rounded-xl">
            {oferta.precio_original && (
              <span className="block text-slate-400 line-through text-xs mb-0.5">
                ${oferta.precio_original.toLocaleString("es-AR")}
              </span>
            )}
            {oferta.precio_descuento && (
              <span className="block text-[#FFBF00] font-black text-xl">
                ${oferta.precio_descuento.toLocaleString("es-AR")}
              </span>
            )}
          </div>
        )}
      </div>

      {oferta.condiciones && (
        <div className="mt-1 text-xs text-slate-500 italic bg-white/5 p-2 rounded-md">
          * {oferta.condiciones}
        </div>
      )}
    </div>
  );
}

export default function OfferModule({ ofertas }: { ofertas?: Oferta[] }) {
  const activeOffers = ofertas?.filter((o) => o.activa) ?? [];

  if (activeOffers.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {activeOffers.map((oferta) => (
        <OfferBlock key={oferta.documentId || oferta.id} oferta={oferta} />
      ))}
    </div>
  );
}
