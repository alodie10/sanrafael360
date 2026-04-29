"use client";

import Link from "next/link";
import { WifiOff, MapPin, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-primary/5 animate-pulse" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-primary/10" />

      <div className="relative z-10 max-w-sm mx-auto">
        {/* Icon */}
        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/10">
          <WifiOff className="w-12 h-12 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Sin Señal
        </h1>

        {/* Mountain emoji visual */}
        <div className="text-5xl mb-6">🏔️</div>

        {/* Message */}
        <p className="text-zinc-400 text-lg leading-relaxed mb-2">
          Parece que te perdiste en el{" "}
          <span className="text-primary font-bold">Cañón del Atuel</span>.
        </p>
        <p className="text-zinc-500 text-sm mb-10">
          La conexión no está disponible en este momento. 
          Volvé cuando recuperes la señal y te mostraremos todo San Rafael.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-primary hover:bg-primary/90 active:scale-95 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Reconectando..." : "Reintentar"}
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-2xl transition-all border border-white/10 text-sm"
          >
            <MapPin className="w-4 h-4 text-primary" />
            Ir al Inicio
          </Link>
        </div>

        {/* Brand */}
        <div className="mt-12 text-zinc-700 text-xs font-black uppercase tracking-[0.3em]">
          San Rafael 360
        </div>
      </div>
    </main>
  );
}
