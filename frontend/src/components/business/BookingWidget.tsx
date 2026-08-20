'use client';

import { CalendarCheck, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsappUrl, normalizeWhatsappDigits } from "@/lib/whatsapp";

interface BookingWidgetProps {
  reservaUrl?: string;
  whatsapp?: string;
  businessName: string;
  reservaHabilitada?: boolean;
  ctaHabilitado?: boolean;
  ctaTitulo?: string;
  ctaTexto?: string;
  ctaBotonTexto?: string;
  ctaLink?: string;
  ctaTagConfirmacion?: boolean;
  ctaTagSinComisiones?: boolean;
  /** Slug del módulo SR360: fuerza CTA encendido → /reservas/{slug} */
  reservaModuloSlug?: string | null;
  onTrackClick?: (type: 'whatsapp' | 'website' | 'view') => void;
}

function resolveCtaHref(url?: string): string | undefined {
  if (!url || url.trim() === "") return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    return undefined;
  }
  return undefined;
}

export default function BookingWidget({ 
  reservaUrl, 
  whatsapp, 
  businessName, 
  reservaHabilitada,
  ctaHabilitado,
  ctaTitulo,
  ctaTexto,
  ctaBotonTexto,
  ctaLink,
  ctaTagConfirmacion,
  ctaTagSinComisiones,
  reservaModuloSlug,
  onTrackClick 
}: BookingWidgetProps) {
  const moduloSlug = String(reservaModuloSlug || "").trim();
  const hasModulo = Boolean(moduloSlug);
  const moduloPath = hasModulo ? `/reservas/${moduloSlug}` : undefined;

  // Módulo de reservas SR360: siempre visible y apunta al slug (no WhatsApp).
  // Sin módulo: CTA manual; ojo: cta_habilitado=false (default schema) oculta el widget.
  const isEnabled = hasModulo || ctaHabilitado === true || (ctaHabilitado == null && reservaHabilitada !== false);
  
  if (!isEnabled) return null;

  const finalLink = moduloPath || ctaLink || reservaUrl;
  const validLink = resolveCtaHref(finalLink);
  const validWhatsapp = normalizeWhatsappDigits(whatsapp) || undefined;
  const whatsappUrl = validWhatsapp
    ? buildWhatsappUrl(
        validWhatsapp,
        `¡Hola! Vi tu negocio "${businessName}" en sanrafael360.com y quería comunicarme.`
      )
    : null;

  if (!validLink && !whatsappUrl) return null;

  const title = hasModulo
    ? (ctaTitulo || "Reserve su turno")
    : (ctaTitulo || "Agenda tu Cita");
  const isWhatsappFallback = !validLink && !!whatsappUrl;
  const buttonText = hasModulo
    ? (ctaBotonTexto || "Reservar turno")
    : (ctaBotonTexto || (isWhatsappFallback ? "Consultar Cita" : "Reservar Ahora"));

  return (
    <div className="relative w-full rounded-3xl p-8 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-900 border border-primary/20 shadow-2xl overflow-hidden group mb-12" data-testid="booking-widget">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[120px] -z-10 group-hover:bg-primary/30 transition-all duration-1000" />
      
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <CalendarCheck className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{title}</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            {ctaTexto ? ctaTexto : (
              <>
                No pierdas tu lugar en <span className="text-white font-bold">{businessName}</span>. 
                Reserva ahora de forma directa y asegura tu lugar.
              </>
            )}
          </p>
          
          {(hasModulo || ctaTagConfirmacion || ctaTagSinComisiones) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-primary">
               {(hasModulo || ctaTagConfirmacion) && (
                 <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Confirmación Inmediata</span>
                 </div>
               )}
               {(hasModulo || ctaTagConfirmacion) && ctaTagSinComisiones && (
                 <div className="w-1 h-1 rounded-full bg-primary/30" />
               )}
               {ctaTagSinComisiones && (
                 <span>Sin comisiones</span>
               )}
            </div>
          )}
        </div>

        <div className="w-full shrink-0">
          {!isWhatsappFallback && validLink ? (
            <motion.a 
               href={validLink}
               target={validLink.startsWith('/') ? undefined : '_blank'}
               rel={validLink.startsWith('/') ? undefined : 'noreferrer'}
               data-testid="booking-widget-cta"
               onClick={() => onTrackClick?.('website')}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
            >
               {buttonText}
               <ArrowRight className="w-5 h-5" />
            </motion.a>
          ) : (
            <motion.a 
               href={whatsappUrl || "#"}
               target="_blank"
               rel="noopener noreferrer"
               onClick={() => onTrackClick?.('whatsapp')}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-full bg-green-500 text-white px-6 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-2xl shadow-green-500/30 hover:bg-green-600 transition-all"
            >
               {buttonText}
               <MessageCircle className="w-5 h-5" />
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
}
