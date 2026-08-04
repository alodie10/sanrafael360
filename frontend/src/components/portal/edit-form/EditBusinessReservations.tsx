"use client";

import { CalendarDays, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditBusinessReservationsProps {
  priceRange: string;
  setPriceRange: (val: string) => void;
  ctaHabilitado: boolean;
  setCtaHabilitado: (val: boolean) => void;
  ctaTitulo: string;
  setCtaTitulo: (val: string) => void;
  ctaTexto: string;
  setCtaTexto: (val: string) => void;
  ctaBotonTexto: string;
  setCtaBotonTexto: (val: string) => void;
  ctaLink: string;
  setCtaLink: (val: string) => void;
  ctaTagConfirmacion: boolean;
  setCtaTagConfirmacion: (val: boolean) => void;
  ctaTagSinComisiones: boolean;
  setCtaTagSinComisiones: (val: boolean) => void;
  /** Si hay módulo SR360, el CTA apunta fijo a /reservas/{slug} */
  reservaModuloSlug?: string | null;
}

export default function EditBusinessReservations({
  priceRange,
  setPriceRange,
  ctaHabilitado,
  setCtaHabilitado,
  ctaTitulo,
  setCtaTitulo,
  ctaTexto,
  setCtaTexto,
  ctaBotonTexto,
  setCtaBotonTexto,
  ctaLink,
  setCtaLink,
  ctaTagConfirmacion,
  setCtaTagConfirmacion,
  ctaTagSinComisiones,
  setCtaTagSinComisiones,
  reservaModuloSlug,
}: EditBusinessReservationsProps) {
  const priceOptions = ["Economico", "Moderado", "Medio-Alto", "Alto"];
  const moduloSlug = String(reservaModuloSlug || "").trim();
  const hasModulo = Boolean(moduloSlug);
  const moduloPath = hasModulo ? `/reservas/${moduloSlug}` : "";

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

      {/* Sistema de Reservas / CTA */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <CalendarDays className="w-6 h-6 text-emerald-400" />
           Botón de Acción (CTA)
        </h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">Habilitar Botón Principal</p>
              <p className="text-xs text-slate-500 mt-1">
                {hasModulo
                  ? "Este negocio tiene el módulo de reservas SR360: el CTA queda activo y apunta a la grilla."
                  : "Muestra u oculta la tarjeta de acción en tu perfil público."}
              </p>
            </div>
            <button 
              type="button"
              disabled={hasModulo}
              onClick={() => setCtaHabilitado(!ctaHabilitado)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                (hasModulo || ctaHabilitado) ? 'bg-emerald-500' : 'bg-slate-700',
                hasModulo && "opacity-70 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                (hasModulo || ctaHabilitado) ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {(hasModulo || ctaHabilitado) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              {hasModulo ? (
                <div className="space-y-2 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5" data-testid="cta-modulo-locked">
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Módulo de reservas activo</p>
                  <p className="text-sm text-slate-300">
                    El botón de la ficha apunta automáticamente a{" "}
                    <span className="font-mono text-white">{moduloPath}</span>
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título del CTA</label>
                <input 
                  type="text"
                  value={hasModulo ? (ctaTitulo || "Reserve su turno") : ctaTitulo}
                  onChange={(e) => setCtaTitulo(e.target.value)}
                  placeholder="Ej: Agenda tu Cita, Pedi para llevar..."
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Texto Descriptivo</label>
                <textarea 
                  value={ctaTexto}
                  onChange={(e) => setCtaTexto(e.target.value)}
                  placeholder="Ej: No pierdas tu lugar. Reserva ahora de forma directa."
                  className="w-full h-24 px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Texto del Botón</label>
                <input 
                  type="text"
                  value={ctaBotonTexto}
                  onChange={(e) => setCtaBotonTexto(e.target.value)}
                  placeholder="Ej: Reservar Ahora"
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">URL de Destino (Enlace)</label>
                <input 
                  type="text"
                  value={hasModulo ? moduloPath : ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  disabled={hasModulo}
                  placeholder="https://meitre.com/tu-restaurante"
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60"
                />
                <p className="text-[10px] text-slate-500 ml-1 italic">
                  {hasModulo
                    ? "Lo gestiona el módulo de reservas; no se puede cambiar a mano."
                    : "Si se deja vacío, el botón redirigirá al WhatsApp del negocio."}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Etiquetas Adicionales</p>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      ctaTagConfirmacion ? "bg-emerald-500 border-emerald-500" : "bg-slate-800 border-white/20 group-hover:border-white/40"
                    )}>
                      {ctaTagConfirmacion && <span className="text-slate-900 font-bold text-[10px]">✓</span>}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={ctaTagConfirmacion}
                      onChange={(e) => setCtaTagConfirmacion(e.target.checked)}
                    />
                    <span className="text-sm text-slate-300 select-none">Mostrar etiqueta "Confirmación Inmediata"</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      ctaTagSinComisiones ? "bg-emerald-500 border-emerald-500" : "bg-slate-800 border-white/20 group-hover:border-white/40"
                    )}>
                      {ctaTagSinComisiones && <span className="text-slate-900 font-bold text-[10px]">✓</span>}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={ctaTagSinComisiones}
                      onChange={(e) => setCtaTagSinComisiones(e.target.checked)}
                    />
                    <span className="text-sm text-slate-300 select-none">Mostrar etiqueta "Sin comisiones"</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
