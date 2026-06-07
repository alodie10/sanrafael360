"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, MessageCircle, Calendar } from "lucide-react";
import { Negocio } from "@/types/strapi";
import { cn } from "@/lib/utils";

interface MobileActionFooterProps {
  negocio: Negocio;
  onTrackClick?: (type: 'whatsapp' | 'website' | 'view') => void;
}

export default function MobileActionFooter({ negocio, onTrackClick }: MobileActionFooterProps) {
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!negocio.latitud || !negocio.longitud) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const R = 6371; // km
        const dLat = (negocio.latitud! - position.coords.latitude) * Math.PI / 180;
        const dLon = (negocio.longitud! - position.coords.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(position.coords.latitude * Math.PI / 180) * Math.cos(negocio.latitud! * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        if (d < 1) {
          setDistance(`${(d * 1000).toFixed(0)}m`);
        } else {
          setDistance(`${d.toFixed(1)}km`);
        }
      });
    }
  }, [negocio.latitud, negocio.longitud]);

  const mapsUrl = negocio.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`;
  
  const handleBookingClick = () => {
    if (onTrackClick) onTrackClick('website'); // Or tracking a 'booking' type if supported
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9990] md:hidden">
      {/* Gradiente sutil atrás para separación */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent -z-10 pointer-events-none" />
      
      <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 px-4 py-3 pb-safe-bottom">
        <div className="flex items-center justify-between gap-2">
          {negocio.telefono && (
            <a 
              href={`tel:${negocio.telefono}`}
              className="flex-1 flex flex-col items-center justify-center py-2 bg-white/5 hover:bg-white/10 rounded-2xl active:scale-95 transition-all text-white border border-white/5"
            >
              <Phone className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Llamar</span>
            </a>
          )}

          <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 bg-white/5 hover:bg-white/10 rounded-2xl active:scale-95 transition-all text-white border border-white/5",
              !negocio.telefono && "flex-auto"
            )}
          >
            <MapPin className="w-5 h-5 mb-1 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {distance ? `A ${distance}` : "Llegar"}
            </span>
          </a>

          {(negocio.reserva_habilitada && negocio.reserva_url) ? (
            <a 
              href={negocio.reserva_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBookingClick}
              className="flex-1 flex flex-col items-center justify-center py-2 bg-primary text-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-wider">Reservar</span>
            </a>
          ) : (negocio.telefono_whatsapp || negocio.telefono) ? (
            <a 
              href={`https://wa.me/${(negocio.telefono_whatsapp || negocio.telefono)?.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackClick?.('whatsapp')}
              className="flex-1 flex flex-col items-center justify-center py-2 bg-primary text-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-wider">WhatsApp</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
