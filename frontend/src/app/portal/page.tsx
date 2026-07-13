import { getServerSession } from "next-auth/next";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, PlusCircle, History } from "lucide-react";
import Link from "next/link";
import BusinessPortalCard from "@/components/portal/BusinessPortalCard";
import ActivityLogView from "@/components/portal/ActivityLogView";
import PortalStats from "@/components/portal/PortalStats";
import PortalHeader from "@/components/portal/layout/PortalHeader";
import PortalAdminBanner from "@/components/portal/layout/PortalAdminBanner";
import PortalSupportSection from "@/components/portal/layout/PortalSupportSection";
import {
  getPortalNegocios,
  getPortalStats,
  getSuscripcionPrices,
} from "@/lib/portal";

export default async function PortalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const jwt = session.jwt as string;

  const [negocios, initialStats, subscriptionPrices] = await Promise.all([
    getPortalNegocios(jwt),
    getPortalStats(jwt),
    getSuscripcionPrices(),
  ]);

  const userEmail = session.user?.email?.toLowerCase() || "";
  const isAdmin =
    (session as { user?: { role?: string } }).user?.role === "Admin" ||
    ADMIN_EMAILS.includes(userEmail);

  if (isAdmin && negocios.length === 0) {
    redirect("/portal/admin");
  }

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-primary/30 pt-24">
      <PortalHeader userName={session.user?.name || "Usuario"} />

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {isAdmin && <PortalAdminBanner />}

        <div className="mb-12">
          <h2 className="text-4xl font-serif font-bold text-white mb-8 tracking-tight italic">
            Resumen de Rendimiento
          </h2>
          <PortalStats initialStats={initialStats} />

          <h2 className="text-4xl font-serif font-bold text-white mb-8 tracking-tight italic">
            Mis Negocios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {negocios.length > 0 ? (
              negocios.map((negocio: { id: number; documentId: string }) => (
                <BusinessPortalCard
                  key={negocio.id}
                  negocio={negocio}
                  subscriptionPrices={subscriptionPrices}
                />
              ))
            ) : (
              <div className="col-span-full bg-slate-900/50 border border-white/5 rounded-[3rem] p-16 md:p-24 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Building2 className="w-10 h-10 text-zinc-700" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4 italic">
                  No tienes negocios vinculados
                </h2>
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

        <div className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic">
              Historial de Actividad
            </h2>
          </div>
          <div className="bg-zinc-950/20 border border-white/5 p-8 rounded-[3rem] backdrop-blur-sm">
            <ActivityLogView
              jwt={jwt}
              userId={Number((session as { user: { id: string } }).user.id)}
            />
          </div>
        </div>

        <PortalSupportSection
          jwt={jwt}
          userEmail={session.user?.email || undefined}
          userName={session.user?.name || undefined}
        />
      </main>
    </div>
  );
}
