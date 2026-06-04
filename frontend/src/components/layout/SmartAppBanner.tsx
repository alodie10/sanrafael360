"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartAppBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Comprobar si ya fue cerrado anteriormente en este navegador
    const dismissed = localStorage.getItem("sr360_app_banner_dismissed");
    console.log("--- DEBUG [SmartAppBanner]: dismissed en localStorage =", dismissed);
    
    if (!dismissed) {
      console.log("--- DEBUG [SmartAppBanner]: Programando aparición en 500ms...");
      const timer = setTimeout(() => {
        console.log("--- DEBUG [SmartAppBanner]: Mostrando banner!");
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log("--- DEBUG [SmartAppBanner]: El banner no se muestra porque ya fue descartado anteriormente.");
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("sr360_app_banner_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-[99] md:hidden bg-zinc-950/90 backdrop-blur-md border border-primary/20 p-3 rounded-xl flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              aria-label="Cerrar banner"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30 shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white tracking-tight truncate">San Rafael 360 App</h4>
              <p className="text-[10px] text-zinc-400 truncate">Instalá la guía interactiva oficial</p>
            </div>
          </div>
          
          <Link
            href="/descargar"
            onClick={handleDismiss}
            className="bg-primary text-black text-xs font-black px-4 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,191,0,0.2)] shrink-0"
          >
            INSTALAR
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
