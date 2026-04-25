"use client";

import { useSession } from "next-auth/react";
import { ShieldCheck, LayoutDashboard, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MasterBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;
  
  const userRole = (session as any).user?.role;
  const isAdmin = userRole === 'Admin';
  const isOwner = userRole === 'Propietario' || userRole === 'Authenticated';

  // Solo mostrar a Admin o a usuarios con capacidad de gestión
  if (!isAdmin && !isOwner) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-black border-b border-white/10 h-10 flex items-center px-4 md:px-8 justify-between backdrop-blur-xl bg-black/90">
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
