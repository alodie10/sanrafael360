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
      setIsSubmitting(null);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Consulta Recibida</h3>
        <p className="text-slate-400 leading-relaxed">
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
    <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-md">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Centro de Ayuda</h2>
          <p className="text-slate-500 text-sm">¿Necesitas cambiar algo de tu negocio? Escríbenos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asunto</label>
          <input 
            type="text"
            required
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Solicitud de cambio de categoría"
            className="w-full px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mensaje Detallado</label>
          <textarea 
            required
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Describe aquí tu consulta o el cambio específico que necesitas..."
            className="w-full h-32 px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
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
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
}
