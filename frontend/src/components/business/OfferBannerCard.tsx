"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Expand } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { formatCalendarDate } from "@/lib/calendar-date";
import { Oferta } from "@/types/strapi";
import { ofertaBannerSrcs } from "@/lib/oferta-banners";
import OfferBannerLightbox from "./OfferBannerLightbox";

export default function OfferBannerCard({ oferta, index = 0 }: { oferta: Oferta; index?: number }) {
  const negocio = oferta.negocio;
  const images = ofertaBannerSrcs(oferta);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const hasMany = images.length > 1;

  useEffect(() => {
    if (!hasMany) return;
    const timer = window.setInterval(() => {
      setActive((curr) => (curr + 1) % images.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hasMany, images.length]);

  if (!negocio || images.length === 0) return null;

  const slug = negocio.slug || negocio.documentId;
  const formattedDate = oferta.valida_hasta
    ? formatCalendarDate(oferta.valida_hasta, { day: "numeric", month: "short" })
    : "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true }}
        className="relative flex flex-col w-full h-full min-h-[22rem] bg-black rounded-[1.5rem] overflow-hidden border border-white/10 group shadow-xl hover:shadow-2xl hover:shadow-[#FFBF00]/10"
      >
        {images.map((src, imageIndex) => (
          <img
            key={src}
            src={optimizeCloudinaryUrl(src, "c_limit,w_900,q_auto,f_auto")}
            alt=""
            className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-500 ${
              imageIndex === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {hasMany && (
          <div className="absolute inset-0 z-10 flex">
            <button
              type="button"
              className="w-[30%] h-full"
              aria-label="Banner anterior"
              onClick={() => setActive((curr) => (curr - 1 + images.length) % images.length)}
            />
            <button
              type="button"
              className="w-[40%] h-full"
              aria-label={`Ver banner de ${oferta.titulo} a pantalla completa`}
              data-testid="oferta-banner-card"
              onClick={() => setOpen(true)}
            />
            <button
              type="button"
              className="w-[30%] h-full"
              aria-label="Banner siguiente"
              onClick={() => setActive((curr) => (curr + 1) % images.length)}
            />
          </div>
        )}
        {!hasMany && (
          <button
            type="button"
            className="absolute inset-0 z-10"
            aria-label={`Ver banner de ${oferta.titulo} a pantalla completa`}
            data-testid="oferta-banner-card"
            onClick={() => setOpen(true)}
          />
        )}
        <span className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/55 text-white pointer-events-none">
          <Expand className="w-4 h-4" />
        </span>
        <div className="relative z-20 mt-auto bg-gradient-to-t from-black via-black/70 to-transparent p-5 pt-16 pointer-events-none">
          <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">{negocio.nombre}</p>
          <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">{oferta.titulo}</h4>
          {formattedDate && (
            <p className="text-[#FFBF00] text-[10px] font-bold uppercase tracking-widest mt-2">
              Válido hasta {formattedDate}
            </p>
          )}
        </div>
      </motion.div>
      {open && (
        <OfferBannerLightbox
          images={images}
          startIndex={active}
          alt={oferta.titulo}
          fichaHref={`/negocios/${slug}`}
          fichaLabel={`Ver ficha de ${negocio.nombre}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
