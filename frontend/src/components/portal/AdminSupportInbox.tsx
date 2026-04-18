"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Clock, CheckCircle2, Send, Loader2, User } from "lucide-react";

export default function AdminSupportInbox({ jwt }: { jwt: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [jwt]);

  const fetchTickets = async () => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    try {
      const res = await fetch(`${strapiUrl}/api/soportes?populate=*&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (e) {
      console.error("Error fetching support tickets:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: number) => {
    if (!respuesta.trim()) return;
    
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const res = await fetch(`${strapiUrl}/api/soportes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({
        data: {
          respuesta,
          estado: "respondido"
        }
      })
    });

    if (res.ok) {
      setReplyingTo(null);
      setRespuesta("");
      fetchTickets();
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      {tickets.length === 0 ? (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-20 text-center">
           <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
           <p className="text-zinc-500 font-serif italic text-xl">No hay tickets de soporte pendientes</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="p-8 bg-zinc-950/40 border border-white/10 rounded-[2.5rem] hover:border-primary/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-serif font-bold text-white italic">{ticket.asunto}</h4>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                    Enviado por: <span className="text-white">{ticket.usuario?.username || 'Usuario'}</span> • {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${ticket.estado === 'pendiente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                {ticket.estado}
              </span>
            </div>
            
            <p className="text-zinc-400 leading-relaxed p-6 bg-white/5 rounded-2xl border border-white/5 mb-6 text-sm italic">
              \"{ticket.mensaje}\"
            </p>
            
            {ticket.respuesta ? (
              <div className="mt-4 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <CheckCircle2 className="w-20 h-20 text-primary" />
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Respuesta de Administración:</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{ticket.respuesta}</p>
              </div>
            ) : (
              <div className="mt-4">
                {replyingTo === ticket.id ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escribe tu respuesta oficial a este ticket..."
                      className="w-full h-32 p-6 bg-zinc-900 border border-white/10 rounded-[2rem] text-white text-sm outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleReply(ticket.id)}
                        className="px-8 py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all"
                      >
                        <Send className="w-4 h-4" /> Enviar Mensaje
                      </button>
                      <button 
                        onClick={() => setReplyingTo(null)} 
                        className="px-8 py-3 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(ticket.id)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/5 transition-all"
                  >
                    Responder ahora →
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
