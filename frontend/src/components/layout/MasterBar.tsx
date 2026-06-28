"use client";

import { useSession } from "next-auth/react";
import { ShieldCheck, LayoutDashboard, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MasterBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userRole = (session as any)?.user?.role;
  const isAdmin = userRole === 'Admin';
  const isOwner = userRole === 'Propietario' || userRole === 'Authenticated';
  
  const showMasterBar = !!session && (isAdmin || isOwner);

  // Controlar la variable CSS de la altura del MasterBar
  useEffect(() => {
    if (showMasterBar) {
      document.documentElement.style.setProperty('--master-bar-height', 'calc(40px + env(safe-area-inset-top, 0px))');
      document.documentElement.style.setProperty('--navbar-safe-pt', '0px');
    } else {
      document.documentElement.style.setProperty('--master-bar-height', '0px');
      document.documentElement.style.setProperty('--navbar-safe-pt', 'env(safe-area-inset-top, 0px)');
    }
    return () => {
      document.documentElement.style.setProperty('--master-bar-height', '0px');
      document.documentElement.style.setProperty('--navbar-safe-pt', 'env(safe-area-inset-top, 0px)');
    };
  }, [showMasterBar]);

  // Solo mostrar a Admin o a usuarios con capacidad de gestión
  if (!showMasterBar) return null;

  return (
    <>
      <div className="fixed top-[var(--app-banner-height,0px)] left-0 right-0 z-[100] bg-black border-b border-white/10 h-10 pt-safe flex items-center px-4 md:px-8 justify-between backdrop-blur-xl bg-black/90 box-content">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-primary' : 'text-emerald-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {isAdmin ? 'Master Admin' : 'Panel Propietario'}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <p className="text-[10px] text-zinc-500 uppercase font-bold hidden md:block">
            {pathname.startsWith('/negocios/') ? 'Gestión de Contenido Activa' : `Sesión activa: ${session.user?.name}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {pathname.startsWith('/negocios/') && !pathname.includes('/editar') && (
             <div className="flex items-center gap-2 text-emerald-400 animate-pulse mr-4">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
               <span className="text-[9px] font-black uppercase tracking-widest">Perfil Editable</span>
             </div>
          )}
          <Link 
            href="/portal"
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <LayoutDashboard className="w-3 h-3" />
            {isAdmin ? 'Panel de Control' : 'Mis Negocios'}
          </Link>
        </div>
      </div>
      {/* Espaciador para empujar el contenido hacia abajo */}
      <div className="h-10 w-full" />
    </>
  );
}
