import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Building2, 
  PlusCircle, 
  MapPin, 
  ExternalLink, 
  LayoutDashboard, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Zap,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { getStrapiMedia } from "@/lib/strapi";
import SupportForm from "@/components/portal/SupportForm";

async function getNegocios(jwt: string) {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  try {
    const res = await fetch(`${strapiUrl}/api/negocios/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error("❌ Error fetching negocios:", e);
    return [];
  }
}

export default async function PortalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const negocios = await getNegocios(session.jwt as string);
  const isAdmin = ['diegocristianalonso@gmail.com', 'placeholder@admin.com'].includes(session.user?.email || '');

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* Header Premium */}
      <div className="bg-slate-900/50 border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tighter uppercase">Mi Propiedad</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Centro de Control de Negocio • San Rafael 360</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/5 pl-2 pr-5 py-2 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-xl border border-white/10">
                {session.user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Conectado como</p>
                <p className="text-sm text-white font-bold leading-none mt-0.5">{session.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Admin Access Banner (Solo para Admins) */}
        {isAdmin && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <Link 
              href="/portal/admin"
              className="group flex items-center justify-between p-6 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-[2.5rem] hover:border-blue-500 transition-all shadow-2xl shadow-blue-900/10"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Panel de Control Admin</h2>
                  <p className="text-blue-300/70">Gestiona los reclamos pendientes y el soporte de toda la plataforma.</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl group-hover:bg-blue-500 transition-colors">
                Entrar ahora <Zap className="w-4 h-4 fill-white" />
              </div>
            </Link>
          </div>
        )}

        {/* Sección de Negocios */}
        <div className="mb-12">
           <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Mis Negocios</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {negocios.length > 0 ? (
              negocios.map((negocio: any) => (
                <div key={negocio.id} className="group bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/20">
                  <div className="relative h-48 bg-slate-800">
                    {negocio.imagen_portada ? (
                      <img 
                        src={getStrapiMedia(negocio.imagen_portada.url)} 
                        alt={negocio.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Building2 className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/10">
                      {negocio.estado_reclamo === 'aprobado' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Aprobado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pendiente</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-2 truncate uppercase tracking-tighter">
                      {negocio.nombre}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                      <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{negocio.categoria?.nombre || "Directorio San Rafael"}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Link 
                        href={`/negocios/${negocio.slug}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> Ver Perfil
                      </Link>
                      <Link 
                        href={`/portal/negocios/${negocio.documentId}/editar`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                      >
                        Editar Info
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-slate-900/50 border border-white/5 rounded-[3rem] p-16 md:p-24 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Building2 className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">No tienes negocios vinculados</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                  Para empezar a gestionar tu presencia en <span className="text-white font-bold tracking-tight">SAN RAFAEL 360</span>, debes primero reclamar la propiedad de tu negocio.
                </p>
                <Link 
                  href="/negocios"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                >
                  <PlusCircle className="w-6 h-6" /> Buscar mi Negocio
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Soporte y Ayuda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-20">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white tracking-tighter">¿Necesitas ayuda adicional?</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Si encuentras algún problema técnico o necesitas realizar un cambio en campos protegidos (como el nombre de tu negocio o categoría), envíanos un mensaje.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Dudas inmediatas</p>
                <a 
                  href="https://wa.me/5492604000000" 
                  target="_blank"
                  className="text-white font-bold hover:text-blue-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500 fill-green-500" />
                  </div>
                  WhatsApp Admin
                </a>
              </div>
              <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Estado de atención</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-white font-bold text-lg">Online</p>
                </div>
              </div>
            </div>
          </div>

          <SupportForm jwt={session.jwt as string} />
        </div>
      </main>
    </div>
  );
}
