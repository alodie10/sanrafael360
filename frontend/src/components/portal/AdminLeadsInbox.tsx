import { Users, Mail, Phone, Building2, CheckCircle2, Loader2, ArrowRight, Search, X, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { STRAPI_URL } from "@/lib/strapi";
import { motion, AnimatePresence } from "framer-motion";

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
  negocio_vinculado?: {
    nombre: string;
    documentId: string;
  };
}

export default function AdminLeadsInbox({ jwt, onConverted, onGoToDiscovery }: { jwt: string, onConverted?: () => void, onGoToDiscovery?: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [vinculatingLead, setVinculatingLead] = useState<Lead | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const [foundBusinesses, setFoundBusinesses] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [jwt]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/leads?sort=createdAt:desc&populate[negocio_vinculado][fields][0]=nombre`, {
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

  const searchBusinesses = async (query: string) => {
    if (query.length < 3) {
      setFoundBusinesses([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/negocios?filters[nombre][$containsi]=${query}&pagination[limit]=5`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      setFoundBusinesses(data.data || []);
    } catch (e) {
      console.error("Error searching businesses:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConvert = async (negocioId: string) => {
    if (!vinculatingLead) return;
    setIsConverting(true);
    setError(null);

    try {
      const res = await fetch(`${STRAPI_URL}/api/leads/${vinculatingLead.documentId}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ negocioId })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Error al vincular el negocio.");
      }

      setVinculatingLead(null);
      await fetchLeads();
      if (onConverted) onConverted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConverting(false);
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
                  {lead.negocio_vinculado && (
                    <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Vinculado con: {lead.negocio_vinculado.nombre}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
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
                onClick={() => {
                  setVinculatingLead(lead);
                  setBusinessSearch(lead.nombre_negocio);
                  searchBusinesses(lead.nombre_negocio);
                }}
                disabled={lead.estado === 'convertido'}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
              >
                {lead.estado === 'convertido' ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                {lead.estado === 'convertido' ? "Vinculado" : "Vincular con Negocio"}
              </button>
              
              <button 
                onClick={() => updateLeadStatus(lead.documentId, 'contactado')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 transition-all"
              >
                Marcar como Contactado
              </button>
            </div>
          </div>
        ))
      )}

      {/* Vinculation Modal */}
      <AnimatePresence>
        {vinculatingLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-2 italic tracking-tight">Vincular Dueño</h2>
                  <p className="text-zinc-500 text-sm">
                    Busca el negocio en nuestra base de datos para asignárselo a <span className="text-white font-bold">{vinculatingLead.nombre_completo}</span>.
                  </p>
                </div>
                <button onClick={() => setVinculatingLead(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input 
                    type="text"
                    value={businessSearch}
                    onChange={(e) => {
                      setBusinessSearch(e.target.value);
                      searchBusinesses(e.target.value);
                    }}
                    placeholder="Buscar negocio por nombre..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                  {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />}
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {foundBusinesses.length > 0 ? (
                    foundBusinesses.map((biz) => (
                      <button 
                        key={biz.id}
                        onClick={() => handleConvert(biz.documentId)}
                        disabled={isConverting}
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/50">
                            <Building2 className="w-5 h-5 text-zinc-500 group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{biz.nombre}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{biz.direccion || "Sin dirección"}</p>
                          </div>
                        </div>
                        {isConverting ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />}
                      </button>
                    ))
                  ) : businessSearch.length >= 3 && !isSearching ? (
                    <div className="text-center py-10 px-6 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                      <Zap className="w-10 h-10 text-primary/30 mx-auto mb-4" />
                      <p className="text-zinc-400 text-sm italic mb-2">No encontramos ese negocio en nuestra base.</p>
                      <p className="text-[10px] text-zinc-600 uppercase font-black mb-8 tracking-widest leading-relaxed">
                        Es probable que aún no lo hayas importado de Google Maps.
                      </p>
                      
                      <button 
                        onClick={onGoToDiscovery}
                        className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-primary/10"
                      >
                        <Search className="w-4 h-4" />
                        Ir a Discovery para Importar
                      </button>
                    </div>
                  ) : null}
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em] leading-relaxed">
                  Al confirmar, se creará el usuario propietario si no existe <br /> y se enviará un email automático de bienvenida.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
