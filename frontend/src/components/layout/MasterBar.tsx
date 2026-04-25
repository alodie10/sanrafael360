"use client";

import { useSession } from "next-auth/react";
import { ShieldCheck, LayoutDashboard, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MasterBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Solo mostrar si es Admin
  const isAdmin = (session as any)?.user?.role === 'Admin';

  if (!isAdmin) return null;

  return (
    <div className="bg-zinc-950 border-b border-primary/20 py-2 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[60] backdrop-blur-md bg-opacity-90">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Modo Master Activo</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
        <p className="text-[10px] text-zinc-500 uppercase font-bold hidden md:block">
          Estás navegando como administrador global
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link 
          href="/portal/admin"
          className="flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <LayoutDashboard className="w-3 h-3" />
          Panel de Control
        </Link>
        
        {pathname.startsWith('/negocios/') && !pathname.includes('/editar') && (
           <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
             <span className="text-[9px] font-black uppercase tracking-widest">Perfil Editable</span>
           </div>
        )}
      </div>
    </div>
  );
}
