import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  ExternalLink,
  PlusCircle,
  LayoutDashboard,
  AlertCircle
} from "lucide-react";
import AdminClaimCard from "@/components/portal/AdminClaimCard";
import Link from "next/link";

async function getPendingClaims(jwt: string) {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  const res = await fetch(`${strapiUrl}/api/negocios/admin/pending-claims`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Whitelist de Admins
  const ADMIN_EMAILS = ['diegocristianalonso@gmail.com', 'placeholder@admin.com'];
  if (!ADMIN_EMAILS.includes(session.user?.email || '')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-950 border border-red-500/20 p-8 rounded-[2.5rem] text-center shadow-2xl shadow-red-950/10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-4 italic">Acceso Restringido</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            No tienes permisos de administrador para acceder a este panel. Si crees que esto es un error, contacta al equipo técnico.
          </p>
          <Link 
            href="/portal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold uppercase text-xs tracking-widest border border-white/5"
          >
            Volver a mi Portal
          </Link>
        </div>
      </div>
    );
  }

  const claims = await getPendingClaims(session.jwt as string);

  return (
    <div className="min-h-screen bg-black pb-20 pt-24">
      {/* Sub-Header Premium */}
      <div className="bg-zinc-950/50 border-b border-white/5 backdrop-blur-xl sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Panel de Control Admin</h1>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Gestión Estratégica • San Rafael 360</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Sitio Público
            </Link>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-primary/20 flex items-center justify-center text-primary font-serif font-bold text-lg">
                {session.user?.name?.charAt(0) || "D"}
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Admin Role</p>
                <p className="text-sm text-white font-bold truncate max-w-[150px] leading-none mt-0.5">{session.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-2">
            <div className="p-6 mb-6 bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-[2rem] text-white shadow-2xl shadow-primary/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Solicitudes</p>
              <p className="text-3xl font-serif font-bold italic">{claims.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Reclamos Pendientes</p>
            </div>

            <button className="w-full flex items-center gap-3 px-6 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95">
              <AlertCircle className="w-5 h-5" /> Gestión Reclamos
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-transparent hover:border-white/10 mt-2">
              <MessageSquare className="w-5 h-5 text-primary/50" /> Soporte
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-transparent hover:border-white/10 mt-2">
              <Users className="w-5 h-5 text-primary/50" /> Base de Dueños
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3 italic">
                <LayoutDashboard className="w-8 h-8 text-primary" /> 
                Solicitudes Pendientes
              </h2>
            </div>

            {claims.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {claims.map((claim: any) => (
                  <AdminClaimCard 
                    key={claim.id} 
                    claim={claim} 
                    jwt={session.jwt as string}
                    onResolve={() => redirect("/portal/admin")} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-20 text-center backdrop-blur-sm">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
                  <PlusCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-3 italic">¡Todo al día!</h3>
                <p className="text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  No hay solicitudes de propiedad pendientes de revisión en este momento. Los nuevos reclamos aparecerán aquí automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
