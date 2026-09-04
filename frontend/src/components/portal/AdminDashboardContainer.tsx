"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, 
  Users, 
  MessageSquare, 
  History,
  Zap,
  Search,
  BarChart3,
  CreditCard,
  Mail,
  CheckCircle2,
  CalendarDays,
  CalendarHeart,
  Megaphone,
} from "lucide-react";
import { getStrapiUrl } from "@/lib/strapi";
import Link from "next/link";
import type { PeriodPreset } from "@/lib/performance-period";
import { rangeFromPreset } from "@/lib/performance-period";
import AdminClaimCard from "./AdminClaimCard";
import AdminSupportInbox from "./AdminSupportInbox";
import AdminLeadsInbox from "./AdminLeadsInbox";
import AdminDiscoveryTool from "./AdminDiscoveryTool";
import ActivityLogView from "./ActivityLogView";
import AdminPaymentsView from "./AdminPaymentsView";
import PortalStats from "./PortalStats";
import AdminTopRanking from "./AdminTopRanking";
import AdminStatsChart from "./AdminStatsChart";
import AdminClientesPanel from "./AdminClientesPanel";
import PerformancePeriodFilter from "./PerformancePeriodFilter";
import AdminProspeccionPanel from "./AdminProspeccionPanel";
import AdminEfemeridesPanel from "./AdminEfemeridesPanel";
import type { ProspeccionNegocio } from "@/lib/prospeccion";

export default function AdminDashboardContainer({ session, initialClaims }: { session: any, initialClaims: any[] }) {
  const [activeTab, setActiveTab] = useState<'claims' | 'support' | 'activity' | 'leads' | 'discovery' | 'stats' | 'payments' | 'clientes' | 'prospeccion' | 'efemerides'>('payments');
  const [claims, setClaims] = useState(initialClaims);
  const [supportCount, setSupportCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [prospeccionPrecarga, setProspeccionPrecarga] = useState<ProspeccionNegocio | null>(null);

  const initialPerfRange = rangeFromPreset("30d");
  const [perfPreset, setPerfPreset] = useState<PeriodPreset>("30d");
  const [perfStart, setPerfStart] = useState(initialPerfRange.startDate);
  const [perfEnd, setPerfEnd] = useState(initialPerfRange.endDate);

  // Sincronizar estado cuando router.refresh() trae nuevas props del servidor
  useEffect(() => {
    setClaims(initialClaims);
  }, [initialClaims]);

  const fetchCounts = async () => {
    try {
      const strapiUrl = getStrapiUrl();
      
      // Conteo de Soporte
      const resSupport = await fetch(`${strapiUrl}/api/soportes?filters[estado][$eq]=pendiente&pagination[limit]=1`, {
        headers: { Authorization: `Bearer ${session.jwt}` }
      });
      if (resSupport.ok) {
        const data = await resSupport.json();
        setSupportCount(data.meta.pagination.total);
      }

      // Conteo de Leads
      const resLeads = await fetch(`${strapiUrl}/api/leads?filters[estado][$eq]=nuevo&pagination[limit]=1`, {
        headers: { Authorization: `Bearer ${session.jwt}` }
      });
      if (resLeads.ok) {
        const data = await resLeads.json();
        setLeadsCount(data.meta.pagination.total);
      }
    } catch (e) {
      console.error("Error fetching counts", e);
    }
  };

  // Cargar conteos al montar
  useEffect(() => {
    fetchCounts();
  }, [session.jwt]);

  const handleResolveLocally = (documentId: string) => {
    setClaims(prev => prev.filter(c => c.documentId !== documentId));
  };

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
              <h1 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Panel Administrador</h1>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Control Central • San Rafael 360</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all">Sitio Público</Link>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block font-serif">
                 <p className="text-xs text-white font-bold">{session.user?.name}</p>
                 <p className="text-[9px] text-primary uppercase font-black">Status: Master Admin</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation (Mail Client Style) */}
          <aside className="lg:col-span-1 space-y-3">
            <Link
              href="/portal/reservas"
              className="w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              data-testid="admin-reservas-nav"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" />
                <span>Módulo reservas</span>
              </div>
            </Link>

            <button 
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${activeTab === 'stats' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" /> 
                <span>Rendimiento Global</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'payments' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" /> 
                <span>Suscripciones y Pagos</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('claims')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'claims' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" /> 
                <span>Reclamos de Propiedad</span>
              </div>
              {claims.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'claims' ? 'bg-black text-primary' : 'bg-primary text-black'}`}>
                  {claims.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('clientes')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'clientes' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" /> 
                <span>Clientes y avisos</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'leads' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" /> 
                <span>Nuevos Interesados</span>
              </div>
              {leadsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'leads' ? 'bg-black text-primary' : 'bg-primary text-black'}`}>
                  {leadsCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('discovery')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'discovery' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <Search className="w-4 h-4" /> 
              <span>Importar desde Places</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prospeccion')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'prospeccion' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
              data-testid="admin-prospeccion-nav"
            >
              <Megaphone className="w-4 h-4" />
              <span>Prospección</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('efemerides')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'efemerides' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
              data-testid="admin-efemerides-nav"
            >
              <CalendarHeart className="w-4 h-4" />
              <span>Efemérides</span>
            </button>

            
            <button 
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'support' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" /> 
                <span>Bandeja Soporte</span>
              </div>
              {supportCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'support' ? 'bg-black text-primary' : 'bg-primary text-black'}`}>
                  {supportCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg border ${activeTab === 'activity' ? 'bg-primary text-black border-primary shadow-primary/20' : 'bg-white/5 text-zinc-500 hover:text-white border-transparent hover:border-white/10'}`}
            >
              <History className="w-4 h-4" /> 
              <span>Log de Actividad</span>
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8 min-w-0">
            {activeTab === 'stats' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-white italic">Rendimiento General de la Plataforma</h2>

                  <PerformancePeriodFilter
                    preset={perfPreset}
                    startDate={perfStart}
                    endDate={perfEnd}
                    onPreset={(p) => {
                      const range = rangeFromPreset(p);
                      setPerfPreset(p);
                      setPerfStart(range.startDate);
                      setPerfEnd(range.endDate);
                    }}
                    onCustom={() => setPerfPreset("custom")}
                    onStartDate={(v) => {
                      setPerfPreset("custom");
                      setPerfStart(v);
                    }}
                    onEndDate={(v) => {
                      setPerfPreset("custom");
                      setPerfEnd(v);
                    }}
                    onResetToDefault={() => {
                      const range = rangeFromPreset("30d");
                      setPerfPreset("30d");
                      setPerfStart(range.startDate);
                      setPerfEnd(range.endDate);
                    }}
                  />

                  <AdminStatsChart
                    jwt={session.jwt as string}
                    startDate={perfStart}
                    endDate={perfEnd}
                  />
                </div>

                <PortalStats startDate={perfStart} endDate={perfEnd} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AdminTopRanking jwt={session.jwt} />
                  
                  {/* Espacio para futuros gráficos o métricas rápidas */}
                  <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
                    <Zap className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-serif font-bold text-white italic mb-2">Modo Master Admin</h3>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      Estás viendo datos en tiempo real de todo San Rafael. Los clics y vistas se actualizan cada vez que un usuario interactúa con el sitio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Solicitudes de Reclamo</h2>
                {claims.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {claims.map((claim: any) => (
                      <AdminClaimCard 
                        key={claim.id} 
                        claim={claim} 
                        jwt={session.jwt as string}
                        onResolve={() => handleResolveLocally(claim.documentId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-20 text-center">
                    <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
                    <p className="text-zinc-500 font-serif italic text-xl">No hay reclamos pendientes.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'discovery' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Importar Places (Curación Proactiva)</h2>
                <AdminDiscoveryTool
                  jwt={session.jwt as string}
                  onPrecargaProspeccion={(negocio) => {
                    setProspeccionPrecarga(negocio);
                    setActiveTab('prospeccion');
                  }}
                />
              </div>
            )}

            {activeTab === 'prospeccion' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Prospección WhatsApp</h2>
                <AdminProspeccionPanel
                  jwt={session.jwt as string}
                  precarga={prospeccionPrecarga}
                  onPrecargaConsumed={() => setProspeccionPrecarga(null)}
                />
              </div>
            )}

            {activeTab === 'efemerides' && (
              <AdminEfemeridesPanel jwt={session.jwt as string} />
            )}

            {activeTab === 'payments' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Suscripciones y Pagos</h2>
                <AdminPaymentsView jwt={session.jwt as string} />
              </div>
            )}

            {activeTab === 'clientes' && (
              <AdminClientesPanel
                jwt={session.jwt as string}
                adminEmail={session.user?.email}
              />
            )}

            {activeTab === 'leads' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Bandeja de Interesados (Leads)</h2>
                <AdminLeadsInbox 
                  jwt={session.jwt as string} 
                  onConverted={fetchCounts} 
                  onGoToDiscovery={() => setActiveTab('discovery')}
                />
              </div>
            )}

            {activeTab === 'support' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Centro de Mensajes (Inbox)</h2>
                <AdminSupportInbox jwt={session.jwt as string} onReplySuccess={fetchCounts} />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Historial y Auditoría</h2>
                <ActivityLogView jwt={session.jwt as string} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
