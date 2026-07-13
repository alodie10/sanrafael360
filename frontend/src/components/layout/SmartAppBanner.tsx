"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartAppBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Evitar ejecutar en computadoras/tablets (solo móvil < 768px)
    if (typeof window !== "undefined" && window.innerWidth >= 768) return;

    // 1. Comprobar si ya fue cerrado anteriormente en este navegador
    const dismissed = localStorage.getItem("sr360_app_banner_dismissed");
    if (dismissed) {
      console.log("--- DEBUG [SmartAppBanner]: Descartado anteriormente por el usuario.");
      return;
    }

    // 2. Comprobar si se está navegando desde dentro de la propia App instalada (TWA/PWA)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      window.navigator.standalone || 
      document.referrer.includes("android-app://");

    if (isStandalone) {
      console.log("--- DEBUG [SmartAppBanner]: Modo standalone detectado. No se muestra el banner.");
      return;
    }

    // 3. Detectar si es iOS (iPhone/iPad). La descarga de PWA/APK no es natural allí.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      console.log("--- DEBUG [SmartAppBanner]: Usuario en iOS. No se sugiere la app.");
      return;
    }

    // 4. Mostrar banner tras un delay de 500ms
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Controlar la variable CSS para empujar el Navbar y el layout dinámicamente
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isVisible && isMobile) {
      document.documentElement.style.setProperty("--app-banner-height", "48px");
    } else {
      document.documentElement.style.setProperty("--app-banner-height", "0px");
    }
    return () => {
      document.documentElement.style.setProperty("--app-banner-height", "0px");
    };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("sr360_app_banner_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ type: "tween", duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[101] md:hidden h-12 bg-zinc-950/95 backdrop-blur-md border-b border-primary/20 px-3 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Botón X de no volver a mostrar */}
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white transition-colors p-1 shrink-0"
              aria-label="No volver a mostrar"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Icono de descarga */}
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30 shrink-0">
              <Download className="w-4 h-4 text-primary" />
            </div>
            
            {/* Textos descriptivos */}
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold text-white tracking-tight leading-tight truncate">San Rafael 360 App</h4>
              <p className="text-[9px] text-zinc-400 leading-tight truncate">Instalá la guía oficial</p>
            </div>
          </div>
          
          {/* Botón Instalar */}
          <a
            href="/descargar"
            onClick={handleDismiss}
            className="bg-primary text-black text-[10px] font-black px-3.5 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,191,0,0.2)] shrink-0"
          >
            INSTALAR
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
