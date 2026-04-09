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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-8 rounded-[2.5rem] text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            No tienes permisos de administrador para acceder a este panel. Si crees que esto es un error, contacta al equipo técnico.
          </p>
          <Link 
            href="/portal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold"
          >
            Volver a mi Portal
          </Link>
        </div>
      </div>
    );
  }

  const claims = await getPendingClaims(session.jwt as string);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Panel de Control Admin</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">San Rafael 360 • Gestión de Directorio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Ver Sitio Público
            </Link>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {session.user?.name?.charAt(0) || "D"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-400 font-medium">Administrador</p>
                <p className="text-sm text-white font-bold truncate max-w-[150px]">{session.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-2">
            <div className="p-4 mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-blue-900/10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Resumen de Actividad</p>
              <p className="text-2xl font-black">{claims.length} Reclamos Pendientes</p>
            </div>

            <button className="w-full flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all">
              <AlertCircle className="w-5 h-5" /> Gestión de Reclamos
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold transition-all">
              <MessageSquare className="w-5 h-5" /> Consultas de Soporte
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold transition-all">
              <Users className="w-5 h-5" /> Base de Dueños
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-blue-500" /> 
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
                    onResolve={() => redirect("/portal/admin")} // In server components we can use other ways, but for now simple refresh
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-20 text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <PlusCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">¡Todo al día!</h3>
                <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
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
