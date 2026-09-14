"use client";

import { useState } from "react";
import { Expand, Tag } from "lucide-react";
import { Oferta } from "@/types/strapi";
import { formatCalendarDate } from "@/lib/calendar-date";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { isBannerOffer, ofertaBannerSrcs } from "@/lib/oferta-banners";
import OfferBannerLightbox from "./OfferBannerLightbox";
import { isOfertaEnVentana } from "@/lib/oferta-vigencia";

function OfferBlock({ oferta }: { oferta: Oferta }) {
  const [open, setOpen] = useState(false);
  const formattedDate = oferta.valida_hasta
    ? formatCalendarDate(oferta.valida_hasta, { day: "numeric", month: "long" })
    : "";
  const images = isBannerOffer(oferta) ? ofertaBannerSrcs(oferta) : [];
  const preview = images[0] ? optimizeCloudinaryUrl(images[0], "c_limit,w_900,q_auto,f_auto") : null;

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 border-l-4 border-l-[#FFBF00] p-4 rounded-r-2xl rounded-l-md shadow-lg flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[#FFBF00] font-bold text-xs uppercase tracking-wider">
        <Tag className="w-4 h-4 fill-[#FFBF00]/20" />
        <span>Oferta Activa {formattedDate && `· Válida hasta el ${formattedDate}`}</span>
      </div>

      {preview && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black"
            aria-label={`Ver banner de ${oferta.titulo} a pantalla completa`}
            data-testid="oferta-ficha-banner"
          >
            <img src={preview} alt={oferta.titulo} className="w-full max-h-72 object-contain" />
            <span className="absolute top-3 right-3 p-2 rounded-full bg-black/55 text-white">
              <Expand className="w-4 h-4" />
            </span>
          </button>
          {open && (
            <OfferBannerLightbox images={images} alt={oferta.titulo} onClose={() => setOpen(false)} />
          )}
        </>
      )}

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
  const activeOffers = ofertas?.filter((o) => isOfertaEnVentana(o)) ?? [];

  if (activeOffers.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {activeOffers.map((oferta) => (
        <OfferBlock key={oferta.documentId || oferta.id} oferta={oferta} />
      ))}
    </div>
  );
}
