"use client";

import { MapPin, Phone, Clock, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import GoogleMap from "@/components/common/GoogleMap";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";
import { getOpenSchedulesForDay } from "@/lib/schedules";

interface BusinessSidebarProps {
  negocio: Negocio;
  isValidPremium: boolean;
  session: any;
  slug: string;
  setShowClaimModal: (val: boolean) => void;
  router: any;
}

export default function BusinessSidebar({ 
  negocio, 
  isValidPremium, 
  session, 
  slug, 
  setShowClaimModal, 
  router 
}: BusinessSidebarProps) {

  // Helper para sanitizar texto
  const sanitizeText = (text: string) => {
    return text?.replace(/<[^>]*>?/gm, "").trim();
  };

  return (
    <div className="space-y-8">
      {/* Info Card Principal */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Ubicación y Contacto</h3>
        
        <div className="space-y-6">
          {negocio.telefono && (
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Teléfono</p>
                  <p className="text-white font-medium">{negocio.telefono}</p>
              </div>
            </div>
          )}

          {/* Map — RESTRINGIDO A PREMIUM (ETAPA 4) */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Cómo llegar</h4>
              {isValidPremium && (
                <a 
                  href={negocio.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`} 
                  target="_blank"
                  className="text-primary text-[10px] font-black uppercase hover:underline flex items-center gap-1"
                >
                  Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="h-56 rounded-3xl overflow-hidden border border-white/10 relative" data-testid="map-section">
              {isValidPremium ? (
                negocio.latitud && negocio.longitud ? (
                  <GoogleMap lat={negocio.latitud} lng={negocio.longitud} title={negocio.nombre} />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center p-6 text-center text-xs text-slate-500 italic">
                    Ubicación no disponible
                  </div>
                )
              ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #FFBF00 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                    <MapPin className="w-8 h-8 text-primary/20 mb-3" />
                    <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Mapa Premium</h5>
                    <p className="text-[9px] text-slate-500 leading-tight px-4 italic">
                      La ubicación exacta es exclusiva para miembros destacados.
                    </p>
                  </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <MapPin className="w-5 h-5 text-slate-500 mt-1 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">{negocio.direccion || "San Rafael"}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Mendoza, Argentina</p>
            </div>
          </div>

          {/* Horarios (RF-07) — RESTRINGIDO A PREMIUM (ETAPA 4) */}
          {(negocio.horarios_texto || (negocio.schedules && negocio.schedules.length > 0)) && (
            <div className="pt-6 border-t border-white/5" data-testid="business-hours-section">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Horarios</span>
              </div>
              
              {isValidPremium ? (
                negocio.horarios_texto ? (
                  <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                    {sanitizeText(negocio.horarios_texto)}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(day => {
                      const daySchedules = getOpenSchedulesForDay(negocio.schedules, day);
                      const isClosed = daySchedules.length === 0;
                      return (
                        <div key={day} className="flex justify-between gap-4 text-[10px]">
                          <span className="text-slate-500">{day}</span>
                          <div className={cn("font-bold text-right", isClosed ? "text-red-400" : "text-slate-300")}>
                            {isClosed
                              ? "Cerrado"
                              : daySchedules.map((schedule, index) => (
                                  <span key={`${day}-${index}`} className="block">
                                    {schedule.opening_time?.slice(0, 5)} - {schedule.closing_time?.slice(0, 5)}
                                  </span>
                                ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] text-slate-500 italic leading-tight">
                    Horarios de atención exclusivos para miembros destacados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
