"use client";

import { LayoutDashboard } from "lucide-react";

interface PortalHeaderProps {
  userName: string;
}

export default function PortalHeader({ userName }: PortalHeaderProps) {
  return (
    <div className="bg-zinc-950/50 border-b border-primary/10 backdrop-blur-xl sticky top-[72px] z-40">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-primary/80 to-accent rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
            <LayoutDashboard className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight uppercase">Mi Propiedad</h1>
            <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Centro de Control • San Rafael 360</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 pl-2 pr-5 py-2 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center text-primary font-serif font-bold text-xl border border-white/10 group-hover:border-primary/30 transition-colors">
              {userName.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Autenticado</p>
              <p className="text-sm text-white font-bold leading-none mt-0.5">{userName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
