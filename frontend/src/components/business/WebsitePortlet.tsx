"use client";

import { Globe, ExternalLink, ShieldAlert } from "lucide-react";

interface WebsitePortletProps {
  url: string;
  businessName: string;
}

export default function WebsitePortlet({ url, businessName }: WebsitePortletProps) {

  // Normalizar URL para asegurar que tenga protocolo
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;

  // Se adoptó el diseño "Smart Preview Card" para todos los dispositivos
  // para evitar problemas de iframe (X-Frame-Options SAMEORIGIN), 
  // tiempos de carga infinitos y consumo innecesario de recursos.
  return (
    <div className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-8 mb-12 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[100px] -z-10 group-hover:bg-primary/20 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
        <div className="w-24 h-24 shrink-0 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform">
          <div className="absolute inset-0 bg-primary/20 bg-gradient-to-tr from-primary/10 to-transparent" />
          <Globe className="w-10 h-10 text-primary relative z-10" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
             <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] uppercase font-bold text-primary tracking-widest">
                <ShieldAlert className="w-3 h-3" />
                Sitio Oficial Verificado
             </div>
             <h3 className="text-2xl font-heading font-extrabold text-white">Experiencia Web</h3>
             <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
               Explora el contenido completo de <span className="text-white font-bold">{businessName}</span> y descubre todo lo que tiene para ofrecer en su plataforma oficial.
             </p>
          </div>

          <a 
            href={finalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex max-w-sm w-full md:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <ExternalLink className="w-5 h-5" />
            Visitar Sitio Web
          </a>
        </div>
      </div>
    </div>
  );
}
