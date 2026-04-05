"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, ShieldAlert, Monitor, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WebsitePortletProps {
  url: string;
  businessName: string;
}

export default function WebsitePortlet({ url, businessName }: WebsitePortletProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect mobile for performance optimization
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Normalizar URL para asegurar que tenga protocolo
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;

  // Si es móvil, mostramos directamente la "External Preview Card" 
  // para ahorrar recursos y evitar problemas de scrolling de iframes
  if (isMobile) {
    return (
      <div className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-8 mb-12 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[100px] -z-10 group-hover:bg-primary/20 transition-all duration-700" />
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-heading font-extrabold text-white">Sitio Web Oficial</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Explora el contenido completo de <span className="text-white font-bold">{businessName}</span> directamente en su sitio oficial.
            </p>
          </div>

          <a 
            href={finalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full max-w-xs bg-primary text-primary-foreground py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <ExternalLink className="w-5 h-5" />
            Visitar Sitio Web
          </a>
          
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
            <Smartphone className="w-3 h-3" />
            Optimizado para tu dispositivo móvil
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 mb-16">
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary" />
           </div>
           <h2 className="text-xl font-heading font-bold text-white tracking-tight">Experiencia Web Oficial</h2>
         </div>
         <a 
           href={finalUrl} 
           target="_blank" 
           className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
         >
           Abrir en nueva pestaña <ExternalLink className="w-3 h-3" />
         </a>
      </div>

      <div className="relative w-full aspect-video md:aspect-[16/9] lg:aspect-[21/9] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
        {/* Browser Top Bar Mockup */}
        <div className="h-10 bg-slate-800/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 gap-2">
           <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
           </div>
           <div className="mx-auto bg-black/30 rounded-lg px-4 py-1 flex items-center gap-2 max-w-[400px] w-full">
              <Globe className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 truncate">{finalUrl}</span>
           </div>
        </div>

        {/* Iframe Logic */}
        <iframe 
          src={finalUrl}
          className="w-full h-[calc(100%-40px)] border-none"
          onLoad={() => setLoading(false)}
          onError={() => setIframeError(true)}
          title={`Sitio oficial de ${businessName}`}
        />

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Conectando con el servidor...</p>
          </div>
        )}

        {/* Fallback for Iframe Blocking */}
        {iframeError && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
             <ShieldAlert className="w-16 h-16 text-yellow-500 mb-6" />
             <h3 className="text-2xl font-bold text-white mb-4">Seguridad de Navegación</h3>
             <p className="text-slate-400 max-w-md mx-auto mb-8">
               Este sitio web utiliza una política de seguridad estricta que no permite ser visualizado dentro de otros portales.
             </p>
             <a 
               href={finalUrl} 
               target="_blank" 
               className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-extrabold transition-all hover:scale-105"
             >
                Continuar al Sitio Oficial
             </a>
          </div>
        )}
      </div>
    </div>
  );
}
