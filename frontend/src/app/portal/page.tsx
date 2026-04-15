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
import BusinessPortalCard from "@/components/portal/BusinessPortalCard";
import Logo from "@/components/common/Logo";
import { cn } from "@/lib/utils";

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
  const isAdmin = (session as any).user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-primary/30 pt-24">
      {/* Breadcrumb / Sub-header Premium */}
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
                {session.user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Autenticado</p>
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
        )}

        {/* Sección de Negocios */}
        <div className="mb-12">
           <h2 className="text-4xl font-serif font-bold text-white mb-8 tracking-tight italic">Mis Negocios</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {negocios.length > 0 ? (
              negocios.map((negocio: any) => (
                <BusinessPortalCard key={negocio.id} negocio={negocio} />
              ))
            ) : (
              <div className="col-span-full bg-slate-900/50 border border-white/5 rounded-[3rem] p-16 md:p-24 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Building2 className="w-10 h-10 text-zinc-700" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4 italic">No tienes negocios vinculados</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                  Para empezar a gestionar tu presencia en <span className="text-white font-bold tracking-tight">SAN RAFAEL 360</span>, debes primero reclamar la propiedad de tu negocio.
                </p>
                <Link 
                  href="/negocios"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-primary/20 active:scale-95"
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
              <h2 className="text-4xl font-serif font-bold text-white tracking-tight italic">¿Necesitas ayuda adicional?</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Si encuentras algún problema técnico o necesitas realizar un cambio en campos protegidos (como el nombre de tu negocio o categoría), envíanos un mensaje.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] group hover:border-primary/30 transition-all">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Dudas inmediatas</p>
                <a 
                  href="https://wa.me/5492604000000" 
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

          <SupportForm jwt={session.jwt as string} />
        </div>
      </main>
    </div>
  );
}
