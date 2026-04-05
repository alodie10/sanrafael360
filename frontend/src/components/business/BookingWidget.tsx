"use client";

import { CalendarCheck, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface BookingWidgetProps {
  reservaUrl?: string;
  whatsapp?: string;
  businessName: string;
}

export default function BookingWidget({ reservaUrl, whatsapp, businessName }: BookingWidgetProps) {
  // Si no hay reservaUrl ni whatsapp, no mostramos nada 
  // (aunque en un futuro podríamos mostrar un mensaje de "Solicitar Cita")
  if (!reservaUrl && !whatsapp) return null;

  return (
    <div className="relative w-full rounded-3xl p-8 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-900 border border-primary/20 shadow-2xl overflow-hidden group mb-12">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[120px] -z-10 group-hover:bg-primary/30 transition-all duration-1000" />
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Icon & Message */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <CalendarCheck className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">Agenda tu Cita</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            No pierdas tu lugar en <span className="text-white font-bold">{businessName}</span>. 
            Reserva ahora de forma directa y asegura tu experiencia en San Rafael.
          </p>
          
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-primary">
             <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Confirmación Inmediata</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-primary/30" />
             <span>Sin comisiones</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto shrink-0">
          {reservaUrl ? (
            <motion.a 
               href={reservaUrl}
               target="_blank"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="w-full md:w-auto bg-primary text-primary-foreground px-10 py-5 rounded-[1.5rem] font-extrabold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
            >
               Reservar Ahora
               <ArrowRight className="w-6 h-6" />
            </motion.a>
          ) : (
            <motion.a 
               href={`https://wa.me/${whatsapp?.replace(/\D/g,'')}`}
               target="_blank"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="w-full md:w-auto bg-green-500 text-white px-10 py-5 rounded-[1.5rem] font-extrabold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-green-500/30 hover:bg-green-600 transition-all"
            >
               Consultar Cita
               <MessageCircle className="w-6 h-6" />
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
}
