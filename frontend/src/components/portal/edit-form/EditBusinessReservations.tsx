"use client";

import { CalendarDays, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditBusinessReservationsProps {
  priceRange: string;
  setPriceRange: (val: string) => void;
  reservaHabilitada: boolean;
  setReservaHabilitada: (val: boolean) => void;
  reservaUrl: string;
  setReservaUrl: (val: string) => void;
}

export default function EditBusinessReservations({
  priceRange,
  setPriceRange,
  reservaHabilitada,
  setReservaHabilitada,
  reservaUrl,
  setReservaUrl
}: EditBusinessReservationsProps) {
  const priceOptions = ["Economico", "Moderado", "Medio-Alto", "Alto"];

  return (
    <div className="space-y-8">
       {/* Rango de Precios */}
       <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <DollarSign className="w-6 h-6 text-emerald-400" />
           Rango de Precios
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {priceOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setPriceRange(opt)}
              className={cn(
                "px-4 py-3 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest",
                priceRange === opt 
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10" 
                  : "bg-slate-800 border-white/5 text-slate-500 hover:border-white/10"
              )}
            >
              {opt === "Economico" && "$"}
              {opt === "Moderado" && "$$"}
              {opt === "Medio-Alto" && "$$$"}
              {opt === "Alto" && "$$$$"}
              <span className="block mt-1 text-[10px] opacity-60">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sistema de Reservas */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <CalendarDays className="w-6 h-6 text-emerald-400" />
           Sistema de Reservas
        </h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">Habilitar Botón de Reserva</p>
              <p className="text-xs text-slate-500 mt-1">Muestra u oculta la opción de reservar en el perfil público.</p>
            </div>
            <button 
              type="button"
              onClick={() => setReservaHabilitada(!reservaHabilitada)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                reservaHabilitada ? 'bg-emerald-500' : 'bg-slate-700'
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                reservaHabilitada ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {reservaHabilitada && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">URL del Motor de Reservas</label>
              <input 
                type="text"
                value={reservaUrl}
                onChange={(e) => setReservaUrl(e.target.value)}
                placeholder="https://meitre.com/tu-restaurante"
                className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-500 ml-1 italic">Si se deja vacío, el botón de reserva redirigirá al WhatsApp del negocio.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
