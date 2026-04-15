"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SupportFormProps {
  negocioId?: string;
  jwt: string;
}

export default function SupportForm({ negocioId, jwt }: SupportFormProps) {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const res = await fetch(`${strapiUrl}/api/soportes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            asunto,
            mensaje,
            negocio: negocioId,
            estado: "abierto"
          }
        })
      });

      if (!res.ok) throw new Error("Error al enviar el ticket de soporte");

      setSent(true);
    } catch (e: any) {
      setError(e.message);
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2 italic">Consulta Recibida</h3>
        <p className="text-zinc-400 leading-relaxed font-medium">
          Hemos recibido tu mensaje. El administrador revisará tu consulta y nos pondremos en contacto contigo a la brevedad.
        </p>
        <button 
          onClick={() => { setSent(false); setAsunto(""); setMensaje(""); }}
          className="mt-6 text-green-500 font-bold hover:underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/50 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-md shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight italic">Centro de Ayuda</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Asistencia Personalizada</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Asunto de la consulta</label>
          <input 
            type="text"
            required
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Solicitud de cambio de categoría"
            className="w-full px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mensaje Detallado</label>
          <textarea 
            required
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Describe aquí tu consulta o el cambio específico que necesitas..."
            className="w-full h-32 px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:ring-1 focus:ring-primary/50 outline-none resize-none transition-all"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5 flex-shrink-0" />}
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
}
