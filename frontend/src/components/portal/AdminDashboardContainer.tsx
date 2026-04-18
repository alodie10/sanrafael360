"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  ExternalLink,
  PlusCircle,
  LayoutDashboard,
  AlertCircle,
  History,
  Zap,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import AdminClaimCard from "./AdminClaimCard";
import AdminSupportInbox from "./AdminSupportInbox";
import ActivityLogView from "./ActivityLogView";

export default function AdminDashboardContainer({ session, initialClaims }: { session: any, initialClaims: any[] }) {
  const [activeTab, setActiveTab] = useState<'claims' | 'support' | 'activity'>('claims');
  const [claims] = useState(initialClaims);

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
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-2">
            <div className="p-6 mb-6 bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-[2rem] text-white shadow-2xl shadow-primary/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2 italic">PENDIENTES</p>
              <p className="text-3xl font-serif font-bold italic">{claims.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Solicitudes actuales</p>
            </div>

            <button 
              onClick={() => setActiveTab('claims')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${activeTab === 'claims' ? 'bg-primary text-black shadow-primary/20 border-primary' : 'bg-white/5 text-zinc-500 hover:text-white border border-transparent hover:border-white/10'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Gestión Reclamos
            </button>
            
            <button 
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${activeTab === 'support' ? 'bg-primary text-black shadow-primary/20 border-primary' : 'bg-white/5 text-zinc-500 hover:text-white border border-transparent hover:border-white/10'}`}
            >
              <MessageSquare className="w-4 h-4" /> Bandeja de Soporte
            </button>

            <button 
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${activeTab === 'activity' ? 'bg-primary text-black shadow-primary/20 border-primary' : 'bg-white/5 text-zinc-500 hover:text-white border border-transparent hover:border-white/10'}`}
            >
              <History className="w-4 h-4" /> Log de Actividad
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'claims' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Solicitudes de Propiedad</h2>
                {claims.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {claims.map((claim: any) => (
                      <AdminClaimCard 
                        key={claim.id} 
                        claim={claim} 
                        jwt={session.jwt as string}
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

            {activeTab === 'support' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif font-bold text-white mb-6 italic">Centro de Mensajes (Inbox)</h2>
                <AdminSupportInbox jwt={session.jwt as string} />
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
