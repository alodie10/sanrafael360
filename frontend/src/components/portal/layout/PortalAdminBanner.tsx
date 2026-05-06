"use client";

import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";

export default function PortalAdminBanner() {
  return (
    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <Link 
        href="/portal/admin"
        className="group flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 rounded-[2.5rem] hover:border-primary/50 transition-all shadow-2xl shadow-primary/5"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">Panel de Control Admin</h2>
            <p className="text-primary/50">Gestiona los reclamos pendientes y el soporte de toda la plataforma.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl group-hover:bg-primary/90 transition-colors">
          Entrar ahora <Zap className="w-4 h-4 fill-black" />
        </div>
      </Link>
    </div>
  );
}
