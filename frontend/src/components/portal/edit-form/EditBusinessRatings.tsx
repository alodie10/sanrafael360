"use client";

import { Star, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditBusinessRatingsProps {
  triggerDiscovery: boolean;
  setTriggerDiscovery: (val: boolean) => void;
  tripadvisorUrl: string;
  setTripadvisorUrl: (val: string) => void;
  tripadvisorRating: number;
  setTripadvisorRating: (val: number) => void;
  tripadvisorReviewCount: number;
  setTripadvisorReviewCount: (val: number) => void;
}

export default function EditBusinessRatings({
  triggerDiscovery,
  setTriggerDiscovery,
  tripadvisorUrl,
  setTripadvisorUrl,
  tripadvisorRating,
  setTripadvisorRating,
  tripadvisorReviewCount,
  setTripadvisorReviewCount
}: EditBusinessRatingsProps) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
         <Star className="w-6 h-6 text-yellow-400" />
         Valoraciones Externas
      </h2>
      <div className="space-y-8">
        
        {/* Google Maps Discovery Sync */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className={cn("w-4 h-4 text-blue-400", triggerDiscovery && "animate-spin")} />
                Sincronizar Google Maps (Auto-Discovery)
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Al activar esto y guardar, el sistema buscará tu negocio en Google Maps en segundo plano para actualizar tus estrellas automáticamente.</p>
            </div>
            <button 
              type="button"
              onClick={() => setTriggerDiscovery(!triggerDiscovery)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                triggerDiscovery ? 'bg-blue-500' : 'bg-slate-700'
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                triggerDiscovery ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

        {/* TripAdvisor */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">TripAdvisor</h3>
            <p className="text-xs text-slate-500">Dado que TripAdvisor bloquea la sincronización automática, puedes ingresar tus estadísticas manualmente para que se muestren en tu perfil.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">URL del perfil de TripAdvisor</label>
              <input 
                type="text"
                value={tripadvisorUrl}
                onChange={(e) => setTripadvisorUrl(e.target.value)}
                placeholder="https://www.tripadvisor.com.ar/Restaurant_Review..."
                className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Puntaje (Ej: 4.5)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={tripadvisorRating || ""}
                  onChange={(e) => setTripadvisorRating(parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cant. de Reseñas</label>
                <input 
                  type="number"
                  min="0"
                  value={tripadvisorReviewCount || ""}
                  onChange={(e) => setTripadvisorReviewCount(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
