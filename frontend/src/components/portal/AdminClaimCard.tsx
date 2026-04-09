"use client";

import { useState } from "react";
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

interface AdminClaimCardProps {
  claim: any;
  jwt: string;
  onResolve: () => void;
}

export default function AdminClaimCard({ claim, jwt, onResolve }: AdminClaimCardProps) {
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

      onResolve(); // Refresh list
    } catch (e: any) {
      setError(e.message);
      setIsResolving(null);
    }
  };

  const docUrl = claim.documentacion_reclamo?.url ? getStrapiMedia(claim.documentacion_reclamo.url) : null;
  const logoUrl = claim.logo?.url ? getStrapiMedia(claim.logo.url) : null;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-blue-500/30 group">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Business Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                    {claim.nombre.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                  {claim.nombre}
                </h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {claim.direccion || "San Rafael, Mendoza"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Solicitante</p>
                  <p className="font-medium">{claim.owner?.username || "Usuario San Rafael"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Documentación</p>
                  {docUrl ? (
                    <a 
                      href={docUrl} 
                      target="_blank" 
                      className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      Ver Archivo <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-red-400">Sin archivo adjunto</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row md:flex-col gap-3 justify-center">
            <button 
              onClick={() => handleResolve('approved')}
              disabled={!!isResolving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-600/30 rounded-2xl transition-all font-bold disabled:opacity-50"
            >
              {isResolving === 'approved' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Aprobar
            </button>
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={!!isResolving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-2xl transition-all font-bold disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Rechazar
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-white mb-6">Rechazo Cordial</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Explícale al dueño de <span className="text-white font-bold">{claim.nombre}</span> por qué no puedes aprobar la solicitud por ahora.
            </p>
            
            <textarea 
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: La foto del documento aparece borrosa o no coincide con el nombre del negocio solicitado..."
              className="w-full h-40 px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-8 transition-all"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors"
                disabled={isResolving === 'rejected'}
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleResolve('rejected')}
                disabled={!motivo || isResolving === 'rejected'}
                className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResolving === 'rejected' && <Loader2 className="w-5 h-5 animate-spin" />}
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
