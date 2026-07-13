"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo ejecutamos en cliente
    if (typeof window === "undefined") return;

    // Detectar si es iOS y si NO está en modo standalone (ya instalada)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      window.navigator.standalone;

    // Verificar si ya la cerró antes
    const dismissed = localStorage.getItem("sr360_ios_prompt_dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      // Retrasar la aparición para no ser tan invasivos (ej. 3 segundos)
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("sr360_ios_prompt_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl p-4 md:hidden"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 rounded-full p-1"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center mt-1">
            <h3 className="text-white font-bold text-base mb-1">¡Instalá la App en tu iPhone!</h3>
            <p className="text-zinc-400 text-[13px] leading-tight mb-4 px-2">
              Disfrutá la experiencia completa, más rápida y a pantalla completa. Sin descargas pesadas.
            </p>

            <div className="bg-zinc-800/50 rounded-xl p-3 w-full space-y-3">
              <div className="flex items-center gap-3 text-zinc-300 text-[13px]">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-700 text-white font-bold text-xs shrink-0">1</span>
                <span>Toca el ícono <Share className="w-4 h-4 inline mx-0.5 text-blue-500" /> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300 text-[13px]">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-700 text-white font-bold text-xs shrink-0">2</span>
                <span>Selecciona <strong>Agregar a Inicio</strong> <PlusSquare className="w-4 h-4 inline mx-0.5 text-zinc-400" /> en el menú.</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
