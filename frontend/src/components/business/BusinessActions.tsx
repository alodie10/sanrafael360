"use client";

import { MessageCircle, Globe, Instagram, Facebook, Share2 } from "lucide-react";
import { Negocio } from "@/types/strapi";

interface BusinessActionsProps {
  negocio: Negocio;
  isValidPremium: boolean;
  onTrackClick?: (type: 'whatsapp' | 'website') => void;
}

export default function BusinessActions({ negocio, isValidPremium, onTrackClick }: BusinessActionsProps) {
  // Solo se muestra para negocios Premium
  if (!isValidPremium) return null;

  return (
    <section className="bg-slate-900/50 border-b border-white/5 py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-start gap-4">
        {/* COMPARTIR BOTÓN (Siempre visible para Premium) */}
        <button
          onClick={async () => {
            const url = window.location.href;
            const text = `¡Mirá ${negocio.nombre} en San Rafael 360!`;
            if (navigator.share) {
              try { await navigator.share({ title: negocio.nombre, text, url }); }
              catch (err) { console.error("Error compartiendo:", err); }
            } else {
              try {
                await navigator.clipboard.writeText(url);
                alert("¡Enlace copiado al portapapeles!");
              } catch (err) { console.error("Error copiando:", err); }
            }
          }}
          className="flex-1 min-w-[200px] md:flex-none flex items-center justify-center gap-3 bg-zinc-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-zinc-700 hover:scale-105 transition-all shadow-xl shadow-black/20 active:scale-95"
        >
          <Share2 className="w-5 h-5" />
          Compartir
        </button>

        {negocio.whatsapp && (
          <a 
            href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`¡Hola! Vi tu negocio "${negocio.nombre}" en sanrafael360.com y quería hacerte una consulta.`)}`} 
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick?.('whatsapp')}
            className="flex-1 min-w-[200px] md:flex-none flex items-center justify-center gap-3 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        )}
        {negocio.website && (
          <a 
            href={negocio.website.startsWith('http') ? negocio.website : `https://${negocio.website}`} 
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick?.('website')}
            className="flex-1 min-w-[200px] md:flex-none flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-white/10 active:scale-95"
          >
            <Globe className="w-5 h-5" />
            Visitar Web
          </a>
        )}
        {negocio.instagram && (
          <a 
            href={negocio.instagram.startsWith('http') ? negocio.instagram : `https://instagram.com/${negocio.instagram.replace('@','')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 min-w-[200px] md:flex-none flex items-center justify-center gap-3 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-pink-500/20 active:scale-95"
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </a>
        )}
        {negocio.facebook && (
          <a 
            href={negocio.facebook.startsWith('http') ? negocio.facebook : `https://facebook.com/${negocio.facebook}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 min-w-[200px] md:flex-none flex items-center justify-center gap-3 bg-[#1877F2] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </a>
        )}
      </div>
    </section>
  );
}
