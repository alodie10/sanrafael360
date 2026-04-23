"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Phone, Building2, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { STRAPI_URL } from "@/lib/strapi";

interface Lead {
  id: number;
  documentId: string;
  nombre_completo: string;
  nombre_negocio: string;
  email: string;
  telefono: string;
  mensaje: string;
  estado: string;
  createdAt: string;
}

export default function AdminLeadsInbox({ jwt }: { jwt: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [jwt]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/leads?sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      setLeads(data.data || []);
    } catch (e) {
      console.error("Error fetching leads:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (documentId: string, status: string) => {
    try {
      await fetch(`${STRAPI_URL}/api/leads/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ data: { estado: status } })
      });
      await fetchLeads();
    } catch (e) {
      console.error("Error updating lead:", e);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      {leads.length === 0 ? (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-20 text-center">
           <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
           <p className="text-zinc-500 font-serif italic text-xl">No hay nuevas solicitudes de negocios</p>
        </div>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="p-8 bg-zinc-950/40 border border-white/10 rounded-[2.5rem] hover:border-primary/20 transition-all group">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-serif font-bold text-white italic">{lead.nombre_negocio}</h4>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Solicitado por: <span className="text-white">{lead.nombre_completo}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                  lead.estado === 'nuevo' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                  lead.estado === 'contactado' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-green-500/10 text-green-500 border-green-500/20'
                }`}>
                  {lead.estado}
                </span>
                <span className="text-[10px] text-zinc-600 font-bold uppercase">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm text-zinc-300">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm text-zinc-300">{lead.telefono}</span>
              </div>
            </div>
            
            {lead.mensaje && (
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5 mb-6">
                <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-2">Mensaje del interesado:</p>
                <p className="text-sm text-zinc-400 italic">"{lead.mensaje}"</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => updateLeadStatus(lead.documentId, 'contactado')}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                Vincular con Negocio <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => updateLeadStatus(lead.documentId, 'convertido')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 transition-all"
              >
                Marcar como Contactado
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
