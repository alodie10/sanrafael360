"use client";

import { CalendarCheck, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface BookingWidgetProps {
  reservaUrl?: string;
  whatsapp?: string;
  businessName: string;
}

/**
 * Valida si una URL es sintácticamente correcta y tiene un protocolo web.
 * Binario estricto: cualquier URL malformada o vacía retorna false.
 */
function isValidUrl(url?: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function BookingWidget({ reservaUrl, whatsapp, businessName }: BookingWidgetProps) {
  const validReservaUrl = isValidUrl(reservaUrl) ? reservaUrl : undefined;
  const validWhatsapp = whatsapp && whatsapp.replace(/\D/g, "").length >= 10
    ? whatsapp
    : undefined;

  // Silencio visual: si no hay ningún destino válido, no renderizar nada
  if (!validReservaUrl && !validWhatsapp) return null;

  return (
    <div className="relative w-full rounded-3xl p-8 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-900 border border-primary/20 shadow-2xl overflow-hidden group mb-12">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[120px] -z-10 group-hover:bg-primary/30 transition-all duration-1000" />
      
      <div className="flex flex-col gap-8">
        {/* Icon & Message */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <CalendarCheck className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">Agenda tu Cita</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            No pierdas tu lugar en <span className="text-white font-bold">{businessName}</span>. 
            Reserva ahora de forma directa y asegura tu experiencia en San Rafael.
          </p>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-primary">
             <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Confirmación Inmediata</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-primary/30" />
             <span>Sin comisiones</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full shrink-0">
          {validReservaUrl ? (
            <motion.a 
               href={validReservaUrl}
               target="_blank"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
            >
               Reservar Ahora
               <ArrowRight className="w-5 h-5" />
            </motion.a>
          ) : (
            <motion.a 
               href={`https://wa.me/${validWhatsapp?.replace(/\D/g,'')}`}
               target="_blank"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-full bg-green-500 text-white px-6 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-2xl shadow-green-500/30 hover:bg-green-600 transition-all"
            >
               Consultar Cita
               <MessageCircle className="w-5 h-5" />
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
}
