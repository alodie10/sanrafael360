"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  MapPin, 
  User, 
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AdminClaimCardProps {
  claim: any;
  jwt: string;
  onResolve?: () => void;
}

export default function AdminClaimCard({ claim, jwt, onResolve }: AdminClaimCardProps) {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState<'approved' | 'rejected' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (decision: 'approved' | 'rejected') => {
    setIsResolving(decision);
    setError(null);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const res = await fetch(`${strapiUrl}/api/negocios/admin/resolve-claim/${claim.documentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({
          decision,
          motivo: decision === 'rejected' ? motivo : "¡Bienvenido a la plataforma!"
        })
      });

      if (!res.ok) throw new Error("Error al procesar la resolución");

      router.refresh();
      if (onResolve) onResolve(); // Refresh list if provided
    } catch (e: any) {
      setError(e.message);
      setIsResolving(null);
    }
  };

  const docUrl = claim.documentacion_reclamo?.url ? getStrapiMedia(claim.documentacion_reclamo.url) : null;
  const logoUrl = claim.logo?.url ? getStrapiMedia(claim.logo.url) : null;

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/40 group backdrop-blur-xl relative">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="p-8 md:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Business Core Info */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-zinc-950/60 border border-white/10 overflow-hidden shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                {logoUrl ? (
                  <img src={logoUrl} className="w-full h-full object-cover rounded-2xl bg-white" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-serif font-bold text-2xl">
                    {claim.nombre?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Solicitud de Propiedad</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white group-hover:text-primary transition-colors uppercase tracking-tight italic leading-none">
                   {claim.nombre}
                 </h3>
                 <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] pt-2">
                   <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                   <span className="truncate">{claim.direccion || "San Rafael, Mendoza"}</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
               <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-white/10 shadow-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Postulante</p>
                  <p className="font-bold text-sm text-white truncate max-w-[150px]">{claim.owner?.username || "Usuario SR360"}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{claim.owner?.email}</p>
                </div>
              </div>

               <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-colors",
                  docUrl ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"
                )}>
                  <FileText className={cn("w-5 h-5", docUrl ? "text-primary" : "text-red-500")} />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Documentación</p>
                  {docUrl ? (
                    <a 
                      href={docUrl} 
                      target="_blank" 
                      className="text-primary hover:text-white flex items-center gap-1 font-bold text-xs transition-colors"
                    >
                      Validar Archivo <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                       Faltante <AlertCircle className="w-3 h-3" />
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Message/Reason */}
            <div className="p-6 bg-zinc-950/40 rounded-[2rem] border border-white/5">
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Mensaje del Solicitante</p>
               <p className="text-sm text-zinc-400 italic leading-relaxed">
                  "{claim.descripcion || 'Sin mensaje adicional.'}"
               </p>
            </div>
          </div>

          {/* Action Column */}
          <div className="flex flex-row lg:flex-col gap-4 justify-center lg:w-48">
            <button 
              onClick={() => handleResolve('approved')}
              disabled={!!isResolving}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-primary text-black rounded-3xl transition-all font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isResolving === 'approved' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Aprobar
            </button>
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={!!isResolving}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-white/5 hover:bg-red-600 text-white rounded-3xl transition-all font-black uppercase tracking-widest text-[10px] border border-white/10 hover:border-red-600 shadow-xl hover:shadow-red-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5 text-red-500 group-hover:text-white" />
              Rechazar
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Reject Reason Modal - Refined */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-zinc-950 border border-white/10 w-full max-w-xl rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            
            <h2 className="text-3xl font-serif font-bold text-white mb-4 italic tracking-tight">Resolución Negativa</h2>
            <p className="text-zinc-500 mb-8 leading-relaxed text-balance">
              Debes proporcionar un motivo claro para el rechazo. Este mensaje será enviado por email automáticamente al dueño de <span className="text-white font-bold">{claim.nombre}</span>.
            </p>
            
            <textarea 
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: La documentación adjunta no coincide con los datos del comercio legal..."
              className="w-full h-44 px-6 py-5 bg-zinc-900 border border-white/5 rounded-[2rem] text-white placeholder-zinc-700 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 outline-none resize-none mb-10 transition-all text-sm leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-5 px-8 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/5"
                disabled={isResolving === 'rejected'}
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleResolve('rejected')}
                disabled={!motivo || isResolving === 'rejected'}
                className="flex-1 py-5 px-8 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {isResolving === 'rejected' && <Loader2 className="w-5 h-5 animate-spin" />}
                Confirmar y Notificar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
