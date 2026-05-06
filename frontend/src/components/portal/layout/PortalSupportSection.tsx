"use client";

import { Clock, Zap } from "lucide-react";
import SupportForm from "../SupportForm";

interface PortalSupportSectionProps {
  jwt: string;
  userEmail?: string;
  userName?: string;
}

export default function PortalSupportSection({ jwt, userEmail, userName }: PortalSupportSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-20">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-serif font-bold text-white tracking-tight italic">¿Necesitas ayuda adicional?</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Si encuentras algún problema técnico o necesitas realizar un cambio en campos protegidos (como el nombre de tu negocio o categoría), envíanos un mensaje.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] group hover:border-primary/30 transition-all">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Dudas inmediatas</p>
            <a 
              href={`https://wa.me/5492604000000?text=${encodeURIComponent("Hola! Necesito soporte técnico con mi cuenta de San Rafael 360.")}`} 
              target="_blank"
              className="text-white font-bold hover:text-primary transition-colors flex items-center gap-3 text-lg"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <Zap className="w-5 h-5 text-green-500 fill-green-500" />
              </div>
              WhatsApp Admin
            </a>
          </div>
          <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] group hover:border-primary/30 transition-all">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Estado de atención</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <p className="text-white font-bold text-lg">Online</p>
            </div>
          </div>
        </div>
      </div>

      <SupportForm 
        jwt={jwt} 
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  );
}
