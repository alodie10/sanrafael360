"use client";

import { Crown, Calendar } from "lucide-react";

interface EditBusinessPremiumProps {
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  premiumValidUntil: string;
  setPremiumValidUntil: (val: string) => void;
}

export default function EditBusinessPremium({
  isPremium,
  setIsPremium,
  premiumValidUntil,
  setPremiumValidUntil
}: EditBusinessPremiumProps) {
  return (
    <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
      
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
        <Crown className="w-6 h-6 text-yellow-400" />
        Suscripción Premium (Solo Admins)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider ml-1">Estado Premium</label>
          <div className="flex items-center justify-between p-4 bg-slate-800 border border-white/10 rounded-2xl">
            <div>
              <p className="text-white font-bold">Activar Beneficios Premium</p>
              <p className="text-xs text-slate-400 mt-1">Activa visibilidad extra y galería completa.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider ml-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Válido Hasta
          </label>
          <input 
            type="date"
            value={premiumValidUntil}
            onChange={(e) => setPremiumValidUntil(e.target.value)}
            disabled={!isPremium}
            className="w-full px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white text-base focus:ring-2 focus:ring-yellow-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
          />
          <p className="text-[10px] text-slate-500 ml-1 italic">
            Al cumplirse esta fecha, los beneficios se desactivarán automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
